const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'professor', 'admin'],
    required: true,
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    required: function() { return this.role === 'student'; }
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  profilePicture: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[+]?[1-9]?\d{9,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  academicInfo: {
    gpa: { type: Number, min: 0, max: 4.0, default: 0 },
    major: String,
    year: { type: String, enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'] },
    graduationYear: String,
    totalCredits: { type: Number, default: 0 }
  },
  notifications: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['grade', 'assignment', 'course', 'system'], required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    relatedId: { type: mongoose.Schema.Types.ObjectId }
  }],
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: function(doc, ret) { delete ret.password; return ret; } },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'notifications.createdAt': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for unread notifications count
userSchema.virtual('unreadNotificationsCount').get(function() {
  return (this.notifications || []).filter(n => !n.isRead).length;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update GPA when academic info changes
userSchema.pre('save', function(next) {
  if (this.isModified('academicInfo') && this.role === 'student') {
    // GPA calculation will be handled by the grade update process
    console.log(`GPA updated for student: ${this.fullName}`);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Add notification method
userSchema.methods.addNotification = function(message, type, relatedId = null) {
  this.notifications.unshift({
    message,
    type,
    relatedId,
    createdAt: new Date()
  });
  
  // Keep only last 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
  
  return this.save();
};

// Mark notification as read method
userSchema.methods.markNotificationRead = function(notificationId) {
  const notification = this.notifications.id(notificationId);
  if (notification) {
    notification.isRead = true;
    return this.save();
  }
  throw new Error('Notification not found');
};

// Mark all notifications as read method
userSchema.methods.markAllNotificationsRead = function() {
  this.notifications.forEach(notification => {
    notification.isRead = true;
  });
  return this.save();
};

// Get student statistics
userSchema.methods.getStudentStats = async function() {
  if (this.role !== 'student') {
    throw new Error('Only available for students');
  }

  const Course = mongoose.model('Course');
  const Grade = mongoose.model('Grade');

  const [enrolledCourses, totalGrades] = await Promise.all([
    Course.countDocuments({ 
      'enrolledStudents.student': this._id,
      'enrolledStudents.status': 'enrolled'
    }),
    Grade.countDocuments({ student: this._id })
  ]);

  return {
    enrolledCourses,
    totalGrades,
    gpa: this.academicInfo.gpa || 0,
    totalCredits: this.academicInfo.totalCredits || 0,
    year: this.academicInfo.year,
    major: this.academicInfo.major
  };
};

// Get professor statistics
userSchema.methods.getProfessorStats = async function() {
  if (this.role !== 'professor') {
    throw new Error('Only available for professors');
  }

  const Course = mongoose.model('Course');
  const Grade = mongoose.model('Grade');

  const courses = await Course.find({ professor: this._id, isActive: true });
  const totalStudents = courses.reduce((sum, course) => sum + course.enrolledCount, 0);
  const totalGrades = await Grade.countDocuments({ 
    course: { $in: courses.map(c => c._id) } 
  });

  return {
    totalCourses: courses.length,
    totalStudents,
    totalGrades,
    department: this.department
  };
};

// Generate student ID for new students
userSchema.pre('save', function(next) {
  if (this.role === 'student' && !this.studentId && this.isNew) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.studentId = `${year}${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);