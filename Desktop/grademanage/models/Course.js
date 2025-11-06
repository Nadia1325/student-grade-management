const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Course code cannot exceed 10 characters']
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
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Fall', 'Spring', 'Summer']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)']
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
      enum: ['enrolled', 'dropped', 'completed'],
      default: 'enrolled'
    }
  }],
  maxStudents: {
    type: Number,
    default: 50,
    min: [1, 'Maximum students must be at least 1'],
    max: [200, 'Maximum students cannot exceed 200']
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String,
    room: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ courseCode: 1 });
courseSchema.index({ professor: 1 });
courseSchema.index({ semester: 1, academicYear: 1 });
courseSchema.index({ 'enrolledStudents.student': 1 });

// Virtual for enrolled student count
courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.filter(enrollment => enrollment.status === 'enrolled').length;
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
  return this.maxStudents - this.enrolledCount;
});

// Check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.enrolledStudents.some(enrollment => 
    enrollment.student.toString() === studentId.toString() && 
    enrollment.status === 'enrolled'
  );
};

// Add student to course
courseSchema.methods.enrollStudent = function(studentId) {
  if (this.isStudentEnrolled(studentId)) {
    throw new Error('Student is already enrolled in this course');
  }
  
  if (this.enrolledCount >= this.maxStudents) {
    throw new Error('Course is full');
  }
  
  this.enrolledStudents.push({ student: studentId });
  return this.save();
};

// Remove student from course
courseSchema.methods.dropStudent = function(studentId) {
  const enrollment = this.enrolledStudents.find(enrollment => 
    enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  enrollment.status = 'dropped';
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);