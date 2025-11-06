const mongoose = require('mongoose');

const mcqQuestionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  choices: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0 },
  points: { type: Number, default: 1, min: 0 }
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  type: { type: String, enum: ['file', 'mcq'], required: true },
  totalPoints: { type: Number, default: 100, min: 0 },
  dueDate: { type: Date, required: true, index: true },
  allowLate: { type: Boolean, default: false },
  latePenalty: { type: Number, default: 0, min: 0, max: 100 },
  mcq: {
    questions: [mcqQuestionSchema]
  },
  attachments: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

assignmentSchema.index({ course: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);

