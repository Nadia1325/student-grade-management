const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  assignmentName: {
    type: String,
    required: [true, 'Assignment name is required'],
    trim: true,
    maxlength: [100, 'Assignment name cannot exceed 100 characters']
  },
  assignmentType: {
    type: String,
    required: [true, 'Assignment type is required'],
    enum: {
      values: ['quiz', 'exam', 'homework', 'project', 'participation', 'final', 'midterm', 'lab', 'presentation'],
      message: 'Invalid assignment type'
    },
    lowercase: true,
    index: true
  },
  pointsEarned: {
    type: Number,
    required: [true, 'Points earned is required'],
    min: [0, 'Points earned cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalPoints;
      },
      message: 'Points earned cannot exceed total points'
    }
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [1, 'Total points must be at least 1']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100'],
    index: true
  },
  letterGrade: {
    type: String,
    enum: {
      values: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W'],
      message: 'Invalid letter grade'
    },
    uppercase: true,
    index: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    additionalNotes: String
  },
  dueDate: {
    type: Date,
    index: true
  },
  submittedDate: {
    type: Date
  },
  gradedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Graded by professor is required']
  },
  isLate: {
    type: Boolean,
    default: false,
    index: true
  },
  latePenalty: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  weight: {
    type: Number,
    default: 1,
    min: [0, 'Weight cannot be negative'],
    max: [10, 'Weight cannot exceed 10']
  },
  rubric: [{
    criteria: { type: String, required: true },
    maxPoints: { type: Number, required: true },
    earnedPoints: { type: Number, required: true },
    feedback: String
  }],
  attachments: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  isExcused: {
    type: Boolean,
    default: false
  },
  isExtra: {
    type: Boolean,
    default: false
  },
  semester: String,
  academicYear: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
gradeSchema.index({ student: 1, course: 1 });
gradeSchema.index({ course: 1, assignmentType: 1 });
gradeSchema.index({ gradedDate: -1, course: 1 });
gradeSchema.index({ student: 1, gradedDate: -1 });
gradeSchema.index({ course: 1, percentage: -1 });

// Text index for searching
gradeSchema.index({
  assignmentName: 'text',
  comments: 'text'
});

// Virtual for points display
gradeSchema.virtual('pointsDisplay').get(function() {
  return `${this.pointsEarned}/${this.totalPoints}`;
});

// Virtual for grade status
gradeSchema.virtual('gradeStatus').get(function() {
  if (this.isExcused) return 'excused';
  if (this.isLate) return 'late';
  if (this.isExtra) return 'extra';
  return 'normal';
});

// Virtual for days late
gradeSchema.virtual('daysLate').get(function() {
  if (!this.dueDate || !this.submittedDate || this.submittedDate <= this.dueDate) {
    return 0;
  }
  const diffTime = Math.abs(this.submittedDate - this.dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Calculate percentage and letter grade before saving
gradeSchema.pre('save', function(next) {
  // Calculate percentage
  if (this.isModified('pointsEarned') || this.isModified('totalPoints')) {
    let basePercentage = (this.pointsEarned / this.totalPoints) * 100;
    
    // Apply late penalty if applicable
    if (this.isLate && this.latePenalty > 0) {
      basePercentage = Math.max(0, basePercentage - this.latePenalty);
    }
    
    this.percentage = Math.round(basePercentage * 100) / 100;
    this.letterGrade = this.calculateLetterGrade(this.percentage);
  }
  
  // Check if assignment was submitted late
  if (this.dueDate && this.submittedDate && this.submittedDate > this.dueDate) {
    this.isLate = true;
  }
  
  // Set semester and academic year from course if not set
  if (this.isNew && this.course) {
    this.populate('course', 'semester academicYear').then(() => {
      this.semester = this.course.semester;
      this.academicYear = this.course.academicYear;
      next();
    });
  } else {
    next();
  }
});

// Calculate letter grade based on percentage
gradeSchema.methods.calculateLetterGrade = function(percentage) {
  if (this.isExcused) return 'I';
  
  // Standard grading scale
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
};

// Method to calculate GPA points for this grade
gradeSchema.methods.getGPAPoints = function() {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'I': null, 'W': null
  };
  return gradePoints[this.letterGrade] || 0;
};

// Static method to calculate course average for a student
gradeSchema.statics.calculateCourseAverage = async function(studentId, courseId) {
  try {
    const grades = await this.find({ 
      student: studentId, 
      course: courseId,
      isExcused: false
    });
    
    if (grades.length === 0) return null;
    
    let totalWeightedPoints = 0;
    let totalWeight = 0;
    
    grades.forEach(grade => {
      totalWeightedPoints += (grade.percentage * grade.weight);
      totalWeight += grade.weight;
    });
    
    const average = totalWeight > 0 ? totalWeightedPoints / totalWeight : 0;
    return Math.round(average * 100) / 100;
  } catch (error) {
    console.error('Error calculating course average:', error);
    return null;
  }
};

// Static method to get grade distribution for a course
gradeSchema.statics.getGradeDistribution = async function(courseId) {
  try {
    const pipeline = [
      { $match: { course: new mongoose.Types.ObjectId(courseId), isExcused: false } },
      { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];
    
    const result = await this.aggregate(pipeline);
    
    // Convert to object with all possible grades
    const distribution = {
      'A+': 0, 'A': 0, 'A-': 0,
      'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0,
      'D+': 0, 'D': 0, 'D-': 0,
      'F': 0
    };
    
    result.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(distribution, item._id)) {
        distribution[item._id] = item.count;
      }
    });
    
    return distribution;
  } catch (error) {
    console.error('Error getting grade distribution:', error);
    return {};
  }
};

// Static method to get student analytics
gradeSchema.statics.getStudentAnalytics = async function(studentId, options = {}) {
  try {
    const matchStage = { student: new mongoose.Types.ObjectId(studentId) };
    
    // Add course filter if provided
    if (options.courseId) {
      matchStage.course = new mongoose.Types.ObjectId(options.courseId);
    }
    
    // Add date range filter if provided
    if (options.startDate) {
      matchStage.gradedDate = { $gte: new Date(options.startDate) };
    }
    if (options.endDate) {
      matchStage.gradedDate = { 
        ...matchStage.gradedDate, 
        $lte: new Date(options.endDate) 
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGrades: { $sum: 1 },
          averageGrade: { $avg: '$percentage' },
          highestGrade: { $max: '$percentage' },
          lowestGrade: { $min: '$percentage' },
          totalPoints: { $sum: '$pointsEarned' },
          totalPossible: { $sum: '$totalPoints' },
          lateSubmissions: { $sum: { $cond: ['$isLate', 1, 0] } }
        }
      }
    ];

    const [analytics] = await this.aggregate(pipeline);
    
    if (!analytics) {
      return {
        totalGrades: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalPoints: 0,
        totalPossible: 0,
        lateSubmissions: 0,
        overallPercentage: 0
      };
    }

    analytics.overallPercentage = analytics.totalPossible > 0 ? 
      Math.round((analytics.totalPoints / analytics.totalPossible) * 100 * 100) / 100 : 0;
    
    analytics.averageGrade = Math.round(analytics.averageGrade * 100) / 100;
    
    return analytics;
  } catch (error) {
    console.error('Error getting student analytics:', error);
    return null;
  }
};

// Static method to get assignment type performance
gradeSchema.statics.getAssignmentTypePerformance = async function(studentId, courseId = null) {
  try {
    const matchStage = { student: new mongoose.Types.ObjectId(studentId) };
    if (courseId) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$assignmentType',
          count: { $sum: 1 },
          averagePercentage: { $avg: '$percentage' },
          totalPoints: { $sum: '$pointsEarned' },
          totalPossible: { $sum: '$totalPoints' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const results = await this.aggregate(pipeline);
    
    return results.map(result => ({
      assignmentType: result._id,
      count: result.count,
      averagePercentage: Math.round(result.averagePercentage * 100) / 100,
      overallPercentage: result.totalPossible > 0 ? 
        Math.round((result.totalPoints / result.totalPossible) * 100 * 100) / 100 : 0
    }));
  } catch (error) {
    console.error('Error getting assignment type performance:', error);
    return [];
  }
};

// Post-save middleware to update student GPA
gradeSchema.post('save', async function(doc) {
  try {
    await updateStudentGPA(doc.student);
  } catch (error) {
    console.error('Error updating student GPA:', error);
  }
});

// Post-remove middleware to update student GPA
gradeSchema.post('deleteOne', { document: true }, async function(doc) {
  try {
    await updateStudentGPA(doc.student);
  } catch (error) {
    console.error('Error updating student GPA after deletion:', error);
  }
});

// Helper function to update student GPA
async function updateStudentGPA(studentId) {
  try {
    const User = mongoose.model('User');
    const Grade = mongoose.model('Grade');
    
    // Get all grades for the student
    const grades = await Grade.find({ student: studentId, isExcused: false })
      .populate('course', 'credits semester academicYear');

    if (grades.length === 0) {
      await User.findByIdAndUpdate(studentId, {
        'academicInfo.gpa': 0,
        'academicInfo.totalCredits': 0
      });
      return;
    }

    // Group grades by course
    const courseGrades = {};
    grades.forEach(grade => {
      const courseId = grade.course._id.toString();
      if (!courseGrades[courseId]) {
        courseGrades[courseId] = {
          grades: [],
          credits: grade.course.credits
        };
      }
      courseGrades[courseId].grades.push(grade);
    });

    let totalGradePoints = 0;
    let totalCredits = 0;

    // Calculate GPA for each course
    Object.values(courseGrades).forEach(courseData => {
      // Calculate weighted average for the course
      let totalWeighted = 0;
      let totalWeight = 0;
      
      courseData.grades.forEach(grade => {
        totalWeighted += grade.percentage * grade.weight;
        totalWeight += grade.weight;
      });

      const courseAverage = totalWeight > 0 ? totalWeighted / totalWeight : 0;
      const gradePoints = convertPercentageToGPA(courseAverage);
      
      totalGradePoints += gradePoints * courseData.credits;
      totalCredits += courseData.credits;
    });

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    await User.findByIdAndUpdate(studentId, {
      'academicInfo.gpa': Math.round(gpa * 100) / 100,
      'academicInfo.totalCredits': totalCredits
    });

  } catch (error) {
    console.error('Error updating student GPA:', error);
  }
}

// Helper function to convert percentage to GPA
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

module.exports = mongoose.model('Grade', gradeSchema);