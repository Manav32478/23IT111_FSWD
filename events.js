const express = require('express');
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// List all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email').sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new event
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, eventType } = req.body;
    const imageUrl = req.file ? req.file.path : '';
    const event = new Event({
      title,
      description,
      date,
      eventType,
      imageUrl,
      createdBy: req.user.id,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event details
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit event
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, eventType } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.eventType = eventType || event.eventType;
    if (req.file) {
      event.imageUrl = req.file.path;
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
