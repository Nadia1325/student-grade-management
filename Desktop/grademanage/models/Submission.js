const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  submittedAt: { type: Date, default: Date.now, index: true },
  answers: [{ // for MCQ: answerIndex per question
    q: { type: Number },
    answerIndex: { type: Number }
  }],
  files: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  letterGrade: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  autoGraded: { type: Boolean, default: false },
  feedback: { type: String, maxlength: 2000 }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);

