const express = require('express');
const { body, validationResult } = require('express-validator');
const RegradeRequest = require('../models/RegradeRequest');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const professor = require('../middleware/professor');

const router = express.Router();

// @route   POST /api/regrades
// @desc    Submit a regrade request (students only)
// @access  Private
router.post('/', [
  auth,
  body('gradeId').isMongoId().withMessage('Valid gradeId is required'),
  body('reason').trim().isLength({ min: 5, max: 1000 }).withMessage('Reason must be 5-1000 characters')
], async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit regrade requests' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { gradeId, reason } = req.body;

    const grade = await Grade.findById(gradeId).populate('course gradedBy');
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    // Ensure the student owns the grade
    if (grade.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only appeal your own grades' });
    }

    const course = await Course.findById(grade.course);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Prevent duplicate pending requests for same grade
    const existingPending = await RegradeRequest.findOne({ grade: grade._id, student: req.user.id, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ success: false, message: 'An existing pending regrade request already exists for this grade' });
    }

    const request = new RegradeRequest({
      grade: grade._id,
      student: req.user.id,
      course: course._id,
      professor: course.professor,
      reason,
      history: [{ action: 'submitted', by: req.user.id, message: reason }]
    });

    await request.save();

    // Notify professor
    const professorUser = await User.findById(course.professor);
    if (professorUser) {
      await professorUser.addNotification(`New regrade request for ${course.courseCode}: ${grade.assignmentName}`, 'grade', request._id);
    }

    res.status(201).json({ success: true, message: 'Regrade request submitted', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating regrade request' });
  }
});

// @route   GET /api/regrades/my
// @desc    Get regrade requests for current user (student: own; professor: own courses)
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'professor') {
      query.professor = req.user.id;
    }

    const requests = await RegradeRequest.find(query)
      .populate('grade', 'assignmentName percentage letterGrade')
      .populate('course', 'courseCode name')
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching regrade requests' });
  }
});

// @route   PUT /api/regrades/:id
// @desc    Professor respond to regrade (approve/deny with optional comment)
// @access  Private (Professor only)
router.put('/:id', [
  auth,
  professor,
  body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied'),
  body('professorComment').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { status, professorComment } = req.body;
    const request = await RegradeRequest.findById(req.params.id).populate('grade').populate('course');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Regrade request not found' });
    }

    if (request.professor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. Not course professor' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been resolved' });
    }

    request.status = status;
    if (professorComment !== undefined) request.professorComment = professorComment;
    request.history.push({ action: status, by: req.user.id, message: professorComment });
    await request.save();

    // Notify student
    const student = await User.findById(request.student);
    if (student) {
      const msg = `Regrade ${status} for ${request.course.courseCode}: ${request.grade.assignmentName}`;
      await student.addNotification(msg, 'grade', request._id);
    }

    res.json({ success: true, message: `Regrade ${status}`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating regrade request' });
  }
});

// @route   GET /api/regrades
// @desc    Admin/professor list (prof: own, admin: all)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'professor') {
      query.professor = req.user.id;
    } else if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    const { status } = req.query;
    if (status) query.status = status;

    const requests = await RegradeRequest.find(query)
      .populate('grade', 'assignmentName percentage letterGrade')
      .populate('course', 'courseCode name')
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching regrade requests' });
  }
});

module.exports = router;

