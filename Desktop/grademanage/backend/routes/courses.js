const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Grade = require('../models/Grade');
const auth = require('../middleware/auth');
const professor = require('../middleware/professor');
const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses (with filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { semester, academicYear, professor, search } = req.query;
    let query = { isActive: true };

    // Build filter query
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (professor) query.professor = professor;
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('professor', 'firstName lastName email')
      .populate('enrolledStudents.student', 'firstName lastName studentId')
      .sort({ courseCode: 1 });

    // Filter based on user role
    let filteredCourses = courses;
    if (req.user.role === 'student') {
      // Students only see courses they're enrolled in or can enroll in
      filteredCourses = courses.filter(course => 
        course.isStudentEnrolled(req.user.id) || course.availableSpots > 0
      );
    }

    res.json({
      success: true,
      count: filteredCourses.length,
      courses: filteredCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses'
    });
  }
});

// @route   GET /api/courses/my
// @desc    Get user's courses (enrolled for students, teaching for professors)
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    let courses;

    if (req.user.role === 'professor') {
      courses = await Course.find({ professor: req.user.id, isActive: true })
        .populate('enrolledStudents.student', 'firstName lastName studentId email')
        .sort({ courseCode: 1 });
    } else {
      courses = await Course.find({ 
        'enrolledStudents.student': req.user.id,
        'enrolledStudents.status': 'enrolled',
        isActive: true 
      })
        .populate('professor', 'firstName lastName email')
        .sort({ courseCode: 1 });
    }

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('professor', 'firstName lastName email department')
      .populate('enrolledStudents.student', 'firstName lastName studentId email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user has access to this course
    const hasAccess = req.user.role === 'professor' && course.professor._id.toString() === req.user.id ||
                     req.user.role === 'student' && course.isStudentEnrolled(req.user.id);

    if (!hasAccess && req.user.role === 'student') {
      // Students can see basic info for enrollment purposes
      const basicCourseInfo = {
        _id: course._id,
        courseCode: course.courseCode,
        name: course.name,
        description: course.description,
        semester: course.semester,
        academicYear: course.academicYear,
        credits: course.credits,
        professor: course.professor,
        enrolledCount: course.enrolledCount,
        availableSpots: course.availableSpots,
        maxStudents: course.maxStudents,
        schedule: course.schedule
      };
      return res.json({
        success: true,
        course: basicCourseInfo
      });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course'
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Professors only)
router.post('/', [auth, professor, [
  body('courseCode').trim().isLength({ min: 3, max: 10 }).withMessage('Course code must be 3-10 characters'),
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Course name must be 3-100 characters'),
  body('semester').isIn(['Fall', 'Spring', 'Summer']).withMessage('Invalid semester'),
  body('academicYear').matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6')
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
      courseCode,
      name,
      description,
      semester,
      academicYear,
      credits,
      maxStudents,
      schedule
    } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    const course = new Course({
      courseCode,
      name,
      description,
      semester,
      academicYear,
      credits,
      professor: req.user.id,
      maxStudents: maxStudents || 50,
      schedule: schedule || {}
    });

    await course.save();
    await course.populate('professor', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course professor only)
router.put('/:id', [auth, [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('credits').optional().isInt({ min: 1, max: 6 }),
  body('maxStudents').optional().isInt({ min: 1, max: 200 })
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

    const course = await Course.findById(req.params.id);
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
        message: 'Access denied. You can only update your own courses'
      });
    }

    const { name, description, credits, maxStudents, schedule } = req.body;

    // Update fields
    if (name) course.name = name;
    if (description !== undefined) course.description = description;
    if (credits) course.credits = credits;
    if (maxStudents) course.maxStudents = maxStudents;
    if (schedule) course.schedule = { ...course.schedule, ...schedule };

    await course.save();
    await course.populate('professor', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (soft delete)
// @access  Private (Course professor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
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
        message: 'Access denied. You can only delete your own courses'
      });
    }

    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting course'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private (Students only)
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not active'
      });
    }

    // Try to enroll student
    await course.enrollStudent(req.user.id);

    // Update user's enrolled courses
    const user = await User.findById(req.user.id);
    if (!user.enrolledCourses.includes(course._id)) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }

    // Add notification to user
    user.notifications.push({
      message: `Successfully enrolled in ${course.courseCode} - ${course.name}`,
      type: 'course'
    });
    await user.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error enrolling in course'
    });
  }
});

// @route   POST /api/courses/:id/drop
// @desc    Drop student from course
// @access  Private (Students only)
router.post('/:id/drop', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can drop courses'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Try to drop student
    await course.dropStudent(req.user.id);

    // Update user's enrolled courses
    const user = await User.findById(req.user.id);
    user.enrolledCourses = user.enrolledCourses.filter(
      courseId => courseId.toString() !== course._id.toString()
    );

    // Add notification to user
    user.notifications.push({
      message: `Dropped from ${course.courseCode} - ${course.name}`,
      type: 'course'
    });
    await user.save();

    res.json({
      success: true,
      message: 'Successfully dropped from course'
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error dropping from course'
    });
  }
});

// @route   GET /api/courses/:id/students
// @desc    Get enrolled students for a course
// @access  Private (Course professor only)
router.get('/:id/students', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
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
        message: 'Access denied. You can only view students for your own courses'
      });
    }

    // Get enrolled students with their details
    const enrolledStudents = course.enrolledStudents.filter(enrollment =>
      enrollment.status === 'enrolled'
    );

    // Populate student details
    const studentsWithDetails = await Promise.all(
      enrolledStudents.map(async (enrollment) => {
        const student = await User.findById(enrollment.student)
          .select('firstName lastName email studentId');
        return {
          ...enrollment.toObject(),
          student
        };
      })
    );

    res.json({
      success: true,
      students: studentsWithDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching enrolled students'
    });
  }
});

// @route   GET /api/courses/:id/analytics
// @desc    Get course analytics
// @access  Private (Course professor only)
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
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
        message: 'Access denied. You can only view analytics for your own courses'
      });
    }

    // Get grade distribution
    const gradeDistribution = await Grade.getGradeDistribution(course._id);

    // Get average grade by assignment type
    const assignmentAverages = await Grade.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$assignmentType',
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get enrolled students count
    const enrollmentStats = {
      enrolled: course.enrolledCount,
      capacity: course.maxStudents,
      utilization: Math.round((course.enrolledCount / course.maxStudents) * 100)
    };

    // Get recent activity
    const recentGrades = await Grade.find({ course: course._id })
      .populate('student', 'firstName lastName studentId')
      .sort({ gradedDate: -1 })
      .limit(10);

    res.json({
      success: true,
      analytics: {
        gradeDistribution,
        assignmentAverages,
        enrollmentStats,
        recentActivity: recentGrades
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course analytics'
    });
  }
});

module.exports = router;