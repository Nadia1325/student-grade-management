const mongoose = require('mongoose');

const regradeRequestSchema = new mongoose.Schema({
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
    index: true
  },
  professorComment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  history: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    action: { type: String, enum: ['submitted', 'commented', 'approved', 'denied', 'updated'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

regradeRequestSchema.index({ course: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('RegradeRequest', regradeRequestSchema);

