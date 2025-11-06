const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Course code cannot exceed 10 characters'],
    match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be in format like CS101, MATH201']
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Fall', 'Spring', 'Summer']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Professor is required']
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'dropped', 'completed', 'withdrawn'],
      default: 'enrolled'
    },
    finalGrade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W']
    },
    finalGradeDate: Date
  }],
  maxStudents: {
    type: Number,
    default: 30,
    min: [1, 'Maximum students must be at least 1'],
    max: [200, 'Maximum students cannot exceed 200']
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    room: {
      type: String,
      trim: true,
      maxlength: [20, 'Room cannot exceed 20 characters']
    },
    building: {
      type: String,
      trim: true,
      maxlength: [50, 'Building cannot exceed 50 characters']
    }
  },
  syllabus: {
    objectives: [String],
    topics: [String],
    assessments: [{
      type: { type: String, enum: ['quiz', 'exam', 'homework', 'project', 'participation', 'final', 'midterm'] },
      weight: { type: Number, min: 0, max: 100 },
      description: String
    }],
    gradingScale: {
      type: Map,
      of: Number,
      default: {
        'A+': 97,
        'A': 93,
        'A-': 90,
        'B+': 87,
        'B': 83,
        'B-': 80,
        'C+': 77,
        'C': 73,
        'C-': 70,
        'D+': 67,
        'D': 63,
        'D-': 60,
        'F': 0
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentDeadline: Date,
  dropDeadline: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
courseSchema.index({ courseCode: 1 });
courseSchema.index({ professor: 1 });
courseSchema.index({ semester: 1, academicYear: 1 });
courseSchema.index({ 'enrolledStudents.student': 1 });
courseSchema.index({ isActive: 1, isPublished: 1 });
courseSchema.index({ department: 1 });

// Compound index for searching
courseSchema.index({ 
  courseCode: 'text', 
  name: 'text', 
  description: 'text' 
});

// Virtual for enrolled student count
courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.filter(enrollment => enrollment.status === 'enrolled').length;
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxStudents - this.enrolledCount);
});

// Virtual for full course identifier
courseSchema.virtual('fullIdentifier').get(function() {
  return `${this.courseCode} - ${this.name}`;
});

// Virtual for semester display
courseSchema.virtual('semesterDisplay').get(function() {
  return `${this.semester} ${this.academicYear}`;
});

// Method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.enrolledStudents.some(enrollment => 
    enrollment.student.toString() === studentId.toString() && 
    enrollment.status === 'enrolled'
  );
};

// Method to get student enrollment
courseSchema.methods.getStudentEnrollment = function(studentId) {
  return this.enrolledStudents.find(enrollment => 
    enrollment.student.toString() === studentId.toString()
  );
};

// Method to enroll student
courseSchema.methods.enrollStudent = async function(studentId) {
  // Check if student is already enrolled
  if (this.isStudentEnrolled(studentId)) {
    throw new Error('Student is already enrolled in this course');
  }
  
  // Check if course is full
  if (this.enrolledCount >= this.maxStudents) {
    throw new Error('Course is full');
  }

  // Check enrollment deadline
  if (this.enrollmentDeadline && new Date() > this.enrollmentDeadline) {
    throw new Error('Enrollment deadline has passed');
  }

  // Check if course is published and active
  if (!this.isPublished || !this.isActive) {
    throw new Error('Course is not available for enrollment');
  }

  // Add student to enrolled list
  this.enrolledStudents.push({ 
    student: studentId,
    enrollmentDate: new Date(),
    status: 'enrolled'
  });
  
  return this.save();
};

// Method to drop student
courseSchema.methods.dropStudent = async function(studentId) {
  const enrollment = this.enrolledStudents.find(enrollment => 
    enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }

  // Check drop deadline
  if (this.dropDeadline && new Date() > this.dropDeadline) {
    throw new Error('Drop deadline has passed');
  }
  
  enrollment.status = 'dropped';
  return this.save();
};

// Method to withdraw student (after drop deadline)
courseSchema.methods.withdrawStudent = async function(studentId) {
  const enrollment = this.enrolledStudents.find(enrollment => 
    enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  enrollment.status = 'withdrawn';
  enrollment.finalGrade = 'W';
  enrollment.finalGradeDate = new Date();
  
  return this.save();
};

// Method to complete course for student
courseSchema.methods.completeStudentCourse = async function(studentId, finalGrade) {
  const enrollment = this.enrolledStudents.find(enrollment => 
    enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  enrollment.status = 'completed';
  enrollment.finalGrade = finalGrade;
  enrollment.finalGradeDate = new Date();
  
  return this.save();
};

// Method to get course statistics
courseSchema.methods.getStatistics = async function() {
  const Grade = mongoose.model('Grade');
  
  const grades = await Grade.find({ course: this._id });
  const enrolledStudents = this.enrolledStudents.filter(e => e.status === 'enrolled');
  
  const stats = {
    totalEnrolled: enrolledStudents.length,
    totalDropped: this.enrolledStudents.filter(e => e.status === 'dropped').length,
    totalCompleted: this.enrolledStudents.filter(e => e.status === 'completed').length,
    totalWithdrawn: this.enrolledStudents.filter(e => e.status === 'withdrawn').length,
    availableSpots: this.availableSpots,
    utilizationRate: Math.round((enrolledStudents.length / this.maxStudents) * 100),
    totalGrades: grades.length,
    averageGrade: grades.length > 0 ? 
      Math.round((grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length) * 100) / 100 : 0
  };

  // Grade distribution
  const gradeDistribution = {};
  grades.forEach(grade => {
    gradeDistribution[grade.letterGrade] = (gradeDistribution[grade.letterGrade] || 0) + 1;
  });
  stats.gradeDistribution = gradeDistribution;

  return stats;
};

// Static method to find courses by professor
courseSchema.statics.findByProfessor = function(professorId, options = {}) {
  return this.find({ 
    professor: professorId, 
    ...options 
  }).populate('professor', 'firstName lastName email');
};

// Static method to find available courses for enrollment
courseSchema.statics.findAvailableForEnrollment = function() {
  return this.find({
    isActive: true,
    isPublished: true,
    $expr: { $lt: [{ $size: '$enrolledStudents' }, '$maxStudents'] }
  }).populate('professor', 'firstName lastName email department');
};

// Pre-save middleware to validate schedule
courseSchema.pre('save', function(next) {
  if (this.schedule && this.schedule.startTime && this.schedule.endTime) {
    const start = new Date(`2000-01-01 ${this.schedule.startTime}`);
    const end = new Date(`2000-01-01 ${this.schedule.endTime}`);
    
    if (start >= end) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Pre-save middleware to validate enrollment and drop deadlines
courseSchema.pre('save', function(next) {
  if (this.enrollmentDeadline && this.dropDeadline) {
    if (this.dropDeadline <= this.enrollmentDeadline) {
      return next(new Error('Drop deadline must be after enrollment deadline'));
    }
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);