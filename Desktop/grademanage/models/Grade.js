const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
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
    enum: ['quiz', 'exam', 'homework', 'project', 'participation', 'final', 'midterm'],
    lowercase: true
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
    max: [100, 'Percentage cannot exceed 100']
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
    uppercase: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  },
  dueDate: {
    type: Date
  },
  submittedDate: {
    type: Date
  },
  gradedDate: {
    type: Date,
    default: Date.now
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Graded by professor is required']
  },
  isLate: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    default: 1,
    min: [0, 'Weight cannot be negative'],
    max: [10, 'Weight cannot exceed 10']
  }
}, {
  timestamps: true
});

// Indexes for better performance
gradeSchema.index({ student: 1, course: 1 });
gradeSchema.index({ course: 1, assignmentType: 1 });
gradeSchema.index({ gradedDate: -1 });

// Calculate percentage before saving
gradeSchema.pre('save', function(next) {
  if (this.isModified('pointsEarned') || this.isModified('totalPoints')) {
    this.percentage = Math.round((this.pointsEarned / this.totalPoints) * 100 * 100) / 100;
    this.letterGrade = this.calculateLetterGrade(this.percentage);
  }
  
  // Check if assignment was submitted late
  if (this.dueDate && this.submittedDate && this.submittedDate > this.dueDate) {
    this.isLate = true;
  }
  
  next();
});

// Calculate letter grade based on percentage
gradeSchema.methods.calculateLetterGrade = function(percentage) {
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

// Static method to calculate course average for a student
gradeSchema.statics.calculateCourseAverage = async function(studentId, courseId) {
  const grades = await this.find({ student: studentId, course: courseId });
  
  if (grades.length === 0) return null;
  
  let totalWeightedPoints = 0;
  let totalWeight = 0;
  
  grades.forEach(grade => {
    totalWeightedPoints += (grade.percentage * grade.weight);
    totalWeight += grade.weight;
  });
  
  const average = totalWeight > 0 ? totalWeightedPoints / totalWeight : 0;
  return Math.round(average * 100) / 100;
};

// Static method to get grade distribution for a course
gradeSchema.statics.getGradeDistribution = async function(courseId) {
  const result = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  return result;
};

module.exports = mongoose.model('Grade', gradeSchema);