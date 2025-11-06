const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Submit answers / files (student)
router.post('/', auth, upload.array('files', 5), [
  body('assignment').isMongoId().withMessage('assignment is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { assignment: assignmentId } = req.body;
    const answers = req.body.answers ? JSON.parse(req.body.answers) : undefined;
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Check enrollment
    const course = await Course.findById(assignment.course);
    if (!course || !course.isStudentEnrolled(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    }

    const files = (req.files || []).map(f => ({ filename: f.filename, originalName: f.originalname, size: f.size, mimetype: f.mimetype }));

    // Create or update submission (unique per student/assignment)
    let submission = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
    if (!submission) {
      submission = new Submission({ assignment: assignment._id, course: assignment.course, student: req.user.id });
    }
    if (answers) submission.answers = answers;
    if (files.length) submission.files = files;
    submission.submittedAt = new Date();

    // Auto-grade MCQ
    if (assignment.type === 'mcq' && Array.isArray(assignment.mcq?.questions) && Array.isArray(submission.answers)) {
      let earned = 0;
      let total = 0;
      assignment.mcq.questions.forEach((q, idx) => {
        const pts = q.points ?? 1;
        total += pts;
        const ans = submission.answers.find(a => a.q === idx);
        if (ans && ans.answerIndex === q.correctIndex) earned += pts;
      });
      const percentage = total > 0 ? Math.round((earned / total) * 10000) / 100 : 0;
      submission.score = earned;
      submission.percentage = percentage;
      submission.autoGraded = true;
    }

    await submission.save();

    // If auto-graded, create or update Grade
    if (submission.autoGraded) {
      const existing = await Grade.findOne({ student: req.user.id, course: assignment.course, assignmentName: assignment.title });
      if (existing) {
        existing.pointsEarned = submission.score;
        existing.totalPoints = assignment.mcq?.questions?.reduce((s,q)=>s+(q.points??1),0) || assignment.totalPoints;
        await existing.save();
      } else {
        const grade = new Grade({
          student: req.user.id,
          course: assignment.course,
          assignmentName: assignment.title,
          assignmentType: 'quiz',
          pointsEarned: submission.score,
          totalPoints: assignment.mcq?.questions?.reduce((s,q)=>s+(q.points??1),0) || assignment.totalPoints,
          gradedBy: assignment.professor
        });
        await grade.save();
      }
    }

    res.status(201).json({ success: true, submission });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error submitting assignment' });
  }
});

// List my submissions
router.get('/my', auth, async (req, res) => {
  try {
    const query = req.user.role === 'student' ? { student: req.user.id } : {};
    const subs = await Submission.find(query).populate('assignment', 'title type dueDate').sort({ submittedAt: -1 });
    res.json({ success: true, count: subs.length, submissions: subs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error fetching submissions' });
  }
});

module.exports = router;

