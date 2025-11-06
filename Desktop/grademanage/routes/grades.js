const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const professor = require('../middleware/professor');
const router = express.Router();

// @route   GET /api/grades
// @desc    Get grades (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    const { courseId, studentId, assignmentType, semester } = req.query;

    if (req.user.role === 'student') {
      // Students can only see their own grades
      query.student = req.user.id;
    } else if (req.user.role === 'professor') {
      // Professors can see grades for their courses
      const professorCourses = await Course.find({ professor: req.user.id }).select('_id');
      const courseIds = professorCourses.map(course => course._id);
      query.course = { $in: courseIds };
    }

    // Apply additional filters
    if (courseId) query.course = courseId;
    if (studentId && req.user.role === 'professor') query.student = studentId;
    if (assignmentType) query.assignmentType = assignmentType;

    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'courseCode name semester academicYear')
      .populate('gradedBy', 'firstName lastName')
      .sort({ gradedDate: -1 });

    // Calculate statistics
    const stats = {
      totalGrades: grades.length,
      averageGrade: grades.length > 0 ? 
        Math.round((grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length) * 100) / 100 : 0,
      gradeDistribution: {}
    };

    // Calculate grade distribution
    grades.forEach(grade => {
      if (stats.gradeDistribution[grade.letterGrade]) {
        stats.gradeDistribution[grade.letterGrade]++;
      } else {
        stats.gradeDistribution[grade.letterGrade] = 1;
      }
    });

    res.json({
      success: true,
      count: grades.length,
      grades,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching grades'
    });
  }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get all grades for a specific student
// @access  Private (Student themselves or their professors)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check access permissions
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own grades'
      });
    }

    if (req.user.role === 'professor') {
      // Check if professor teaches any course the student is enrolled in
      const professorCourses = await Course.find({ professor: req.user.id });
      const courseIds = professorCourses.map(course => course._id);
      
      const studentEnrolledInProfessorCourse = await Course.findOne({
        _id: { $in: courseIds },
        'enrolledStudents.student': studentId,
        'enrolledStudents.status': 'enrolled'
      });

      if (!studentEnrolledInProfessorCourse) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view grades for students in your courses'
        });
      }
    }

    const grades = await Grade.find({ student: studentId })
      .populate('course', 'courseCode name semester academicYear credits')
      .populate('gradedBy', 'firstName lastName')
      .sort({ gradedDate: -1 });

    // Calculate GPA and course averages
    const courseAverages = {};
    const courseCredits = {};
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
      const courseId = grade.course._id.toString();
      const credits = grade.course.credits;

      if (!courseAverages[courseId]) {
        courseAverages[courseId] = [];
        courseCredits[courseId] = credits;
      }
      courseAverages[courseId].push(grade.percentage);
    }

    // Calculate course averages and GPA
    const courseGrades = [];
    Object.keys(courseAverages).forEach(courseId => {
      const courseGradesList = courseAverages[courseId];
      const average = courseGradesList.reduce((sum, grade) => sum + grade, 0) / courseGradesList.length;
      const credits = courseCredits[courseId];
      const gpa = convertPercentageToGPA(average);
      
      courseGrades.push({
        courseId,
        average: Math.round(average * 100) / 100,
        gpa,
        credits
      });

      totalGradePoints += gpa * credits;
      totalCredits += credits;
    });

    const overallGPA = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

    // Get student info
    const student = await User.findById(studentId).select('firstName lastName studentId academicInfo');
    
    res.json({
      success: true,
      student,
      grades,
      summary: {
        totalGrades: grades.length,
        overallGPA,
        totalCredits,
        courseGrades
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student grades'
    });
  }
});

// @route   GET /api/grades/course/:courseId
// @desc    Get all grades for a specific course
// @access  Private (Course professor only)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the professor of this course
    if (course.professor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view grades for your own courses'
      });
    }

    const grades = await Grade.find({ course: courseId })
      .populate('student', 'firstName lastName studentId')
      .sort({ 'student.lastName': 1, assignmentName: 1 });

    // Group grades by student
    const studentGrades = {};
    grades.forEach(grade => {
      const studentId = grade.student._id.toString();
      if (!studentGrades[studentId]) {
        studentGrades[studentId] = {
          student: grade.student,
          grades: [],
          average: 0
        };
      }
      studentGrades[studentId].grades.push(grade);
    });

    // Calculate averages for each student
    Object.keys(studentGrades).forEach(studentId => {
      const studentData = studentGrades[studentId];
      let totalWeightedPoints = 0;
      let totalWeight = 0;

      studentData.grades.forEach(grade => {
        totalWeightedPoints += (grade.percentage * grade.weight);
        totalWeight += grade.weight;
      });

      studentData.average = totalWeight > 0 ? 
        Math.round((totalWeightedPoints / totalWeight) * 100) / 100 : 0;
    });

    res.json({
      success: true,
      course: {
        _id: course._id,
        courseCode: course.courseCode,
        name: course.name,
        semester: course.semester,
        academicYear: course.academicYear
      },
      studentGrades: Object.values(studentGrades),
      totalStudents: Object.keys(studentGrades).length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course grades'
    });
  }
});

// @route   POST /api/grades
// @desc    Create a new grade
// @access  Private (Professors only)
router.post('/', [auth, professor, [
  body('student').isMongoId().withMessage('Valid student ID is required'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('assignmentName').trim().isLength({ min: 1, max: 100 }).withMessage('Assignment name is required'),
  body('assignmentType').isIn(['quiz', 'exam', 'homework', 'project', 'participation', 'final', 'midterm']),
  body('pointsEarned').isNumeric().isFloat({ min: 0 }).withMessage('Points earned must be a positive number'),
  body('totalPoints').isNumeric().isFloat({ min: 1 }).withMessage('Total points must be at least 1'),
  body('weight').optional().isFloat({ min: 0, max: 10 })
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      student,
      course,
      assignmentName,
      assignmentType,
      pointsEarned,
      totalPoints,
      comments,
      dueDate,
      submittedDate,
      weight
    } = req.body;

    // Verify course exists and professor has access
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (courseDoc.professor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create grades for your own courses'
      });
    }

    // Verify student exists and is enrolled in the course
    const studentDoc = await User.findById(student);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!courseDoc.isStudentEnrolled(student)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Create grade
    const grade = new Grade({
      student,
      course,
      assignmentName,
      assignmentType,
      pointsEarned,
      totalPoints,
      comments,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      submittedDate: submittedDate ? new Date(submittedDate) : undefined,
      gradedBy: req.user.id,
      weight: weight || 1
    });

    await grade.save();
    await grade.populate('student', 'firstName lastName studentId');
    await grade.populate('course', 'courseCode name');

    // Add notification to student
    studentDoc.notifications.push({
      message: `New grade posted for ${courseDoc.courseCode}: ${assignmentName} - ${grade.letterGrade}`,
      type: 'grade'
    });
    await studentDoc.save();

    // Update student's GPA
    await updateStudentGPA(student);

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      grade
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error creating grade'
    });
  }
});

// @route   PUT /api/grades/:id
// @desc    Update a grade
// @access  Private (Grading professor only)
router.put('/:id', [auth, professor, [
  body('pointsEarned').optional().isNumeric().isFloat({ min: 0 }),
  body('totalPoints').optional().isNumeric().isFloat({ min: 1 }),
  body('weight').optional().isFloat({ min: 0, max: 10 })
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const grade = await Grade.findById(req.params.id).populate('course');
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check if user is the professor who graded this
    if (grade.gradedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update grades you created'
      });
    }

    const { pointsEarned, totalPoints, comments, weight } = req.body;

    // Update fields
    if (pointsEarned !== undefined) grade.pointsEarned = pointsEarned;
    if (totalPoints !== undefined) grade.totalPoints = totalPoints;
    if (comments !== undefined) grade.comments = comments;
    if (weight !== undefined) grade.weight = weight;

    await grade.save();
    await grade.populate('student', 'firstName lastName studentId');

    // Add notification to student about grade update
    const student = await User.findById(grade.student._id);
    student.notifications.push({
      message: `Grade updated for ${grade.course.courseCode}: ${grade.assignmentName} - ${grade.letterGrade}`,
      type: 'grade'
    });
    await student.save();

    // Update student's GPA
    await updateStudentGPA(grade.student._id);

    res.json({
      success: true,
      message: 'Grade updated successfully',
      grade
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error updating grade'
    });
  }
});

// @route   DELETE /api/grades/:id
// @desc    Delete a grade
// @access  Private (Grading professor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check if user is the professor who graded this
    if (grade.gradedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete grades you created'
      });
    }

    await grade.deleteOne();

    // Update student's GPA
    await updateStudentGPA(grade.student);

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting grade'
    });
  }
});

// @route   GET /api/grades/analytics/student/:studentId
// @desc    Get grade analytics for a student
// @access  Private (Student themselves or their professors)
router.get('/analytics/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check access permissions (same as student grades route)
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const grades = await Grade.find({ student: studentId })
      .populate('course', 'courseCode name semester academicYear credits');

    // Group by course and assignment type
    const courseAnalytics = {};
    const assignmentTypeAnalytics = {};

    grades.forEach(grade => {
      const courseId = grade.course._id.toString();
      const assignmentType = grade.assignmentType;

      // Course analytics
      if (!courseAnalytics[courseId]) {
        courseAnalytics[courseId] = {
          course: grade.course,
          grades: [],
          average: 0,
          letterGrade: '',
          trend: []
        };
      }
      courseAnalytics[courseId].grades.push(grade);

      // Assignment type analytics
      if (!assignmentTypeAnalytics[assignmentType]) {
        assignmentTypeAnalytics[assignmentType] = {
          grades: [],
          average: 0,
          count: 0
        };
      }
      assignmentTypeAnalytics[assignmentType].grades.push(grade);
    });

    // Calculate course averages and trends
    Object.keys(courseAnalytics).forEach(courseId => {
      const courseData = courseAnalytics[courseId];
      const courseGrades = courseData.grades.map(g => g.percentage);
      courseData.average = courseGrades.reduce((sum, grade) => sum + grade, 0) / courseGrades.length;
      courseData.letterGrade = convertPercentageToLetterGrade(courseData.average);
      
      // Simple trend calculation (last 3 vs first 3 grades)
      if (courseGrades.length >= 6) {
        const first3 = courseGrades.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const last3 = courseGrades.slice(-3).reduce((a, b) => a + b, 0) / 3;
        courseData.trend = last3 > first3 ? 'improving' : last3 < first3 ? 'declining' : 'stable';
      } else {
        courseData.trend = 'insufficient_data';
      }
    });

    // Calculate assignment type averages
    Object.keys(assignmentTypeAnalytics).forEach(type => {
      const typeData = assignmentTypeAnalytics[type];
      const typeGrades = typeData.grades.map(g => g.percentage);
      typeData.average = typeGrades.reduce((sum, grade) => sum + grade, 0) / typeGrades.length;
      typeData.count = typeGrades.length;
      delete typeData.grades; // Remove detailed grades from response
    });

    res.json({
      success: true,
      analytics: {
        totalGrades: grades.length,
        overallAverage: grades.length > 0 ? 
          Math.round((grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length) * 100) / 100 : 0,
        courseAnalytics: Object.values(courseAnalytics),
        assignmentTypeAnalytics
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching grade analytics'
    });
  }
});

// Helper function to convert percentage to GPA (4.0 scale)
function convertPercentageToGPA(percentage) {
  if (percentage >= 97) return 4.0;
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}

// Helper function to convert percentage to letter grade
function convertPercentageToLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

// Helper function to update student's overall GPA
async function updateStudentGPA(studentId) {
  try {
    const grades = await Grade.find({ student: studentId })
      .populate('course', 'credits');

    const courseGPAs = {};
    
    // Calculate GPA for each course
    grades.forEach(grade => {
      const courseId = grade.course._id.toString();
      const credits = grade.course.credits;
      
      if (!courseGPAs[courseId]) {
        courseGPAs[courseId] = {
          grades: [],
          credits: credits
        };
      }
      courseGPAs[courseId].grades.push(grade.percentage);
    });

    let totalGradePoints = 0;
    let totalCredits = 0;

    // Calculate weighted GPA
    Object.keys(courseGPAs).forEach(courseId => {
      const courseData = courseGPAs[courseId];
      const courseAverage = courseData.grades.reduce((sum, grade) => sum + grade, 0) / courseData.grades.length;
      const gpa = convertPercentageToGPA(courseAverage);
      
      totalGradePoints += gpa * courseData.credits;
      totalCredits += courseData.credits;
    });

    const overallGPA = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

    // Update user's GPA
    await User.findByIdAndUpdate(studentId, {
      'academicInfo.gpa': overallGPA
    });
  } catch (error) {
    console.error('Error updating student GPA:', error);
  }
}

module.exports = router;