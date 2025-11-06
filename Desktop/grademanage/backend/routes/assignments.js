const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const professor = require('../middleware/professor');

const router = express.Router();

// Create assignment (professor)
router.post('/', [auth, professor, [
  body('course').isMongoId(),
  body('title').isLength({ min: 1, max: 200 }),
  body('type').isIn(['file', 'mcq']),
  body('dueDate').isISO8601()
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    const { course, title, description, type, dueDate, allowLate, latePenalty, totalPoints, mcq } = req.body;

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ success: false, message: 'Course not found' });
    if (courseDoc.professor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only course professor can create assignments' });
    }

    const assignment = await Assignment.create({
      course,
      professor: req.user.id,
      title,
      description,
      type,
      dueDate: new Date(dueDate),
      allowLate: !!allowLate,
      latePenalty: latePenalty ?? 0,
      totalPoints: totalPoints ?? 100,
      mcq: type === 'mcq' ? { questions: mcq?.questions || [] } : undefined
    });

    res.status(201).json({ success: true, assignment });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error creating assignment' });
  }
});

// List assignments for a course (both roles)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId, isPublished: true }).sort({ dueDate: 1 });
    res.json({ success: true, count: assignments.length, assignments });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error fetching assignments' });
  }
});

// Update assignment (professor)
router.put('/:id', [auth, professor], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (assignment.professor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only owner professor can update assignment' });
    }

    const updatable = ['title', 'description', 'dueDate', 'allowLate', 'latePenalty', 'totalPoints', 'isPublished', 'mcq'];
    updatable.forEach((k) => { if (req.body[k] !== undefined) assignment[k] = req.body[k]; });
    await assignment.save();
    res.json({ success: true, assignment });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error updating assignment' });
  }
});

// Get recent assignments and courses for student dashboard
router.get('/recent', auth, async (req, res) => {
  try {
    // Get courses the student is enrolled in
    const enrolledCourses = await Course.find({
      'enrolledStudents.student': req.user.id,
      'enrolledStudents.status': 'enrolled'
    }).select('_id courseCode name');

    const courseIds = enrolledCourses.map(c => c._id);

    // Get recent assignments from enrolled courses (last 7 days, upcoming or recent)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const assignments = await Assignment.find({
      course: { $in: courseIds },
      isPublished: true,
      dueDate: { $gte: sevenDaysAgo }
    })
    .populate('course', 'courseCode name')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get recent courses (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCourses = await Course.find({
      createdAt: { $gte: thirtyDaysAgo },
      availableSpots: { $gt: 0 }
    })
    .select('courseCode name createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      assignments,
      courses: recentCourses
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error fetching recent data' });
  }
});

module.exports = router;

