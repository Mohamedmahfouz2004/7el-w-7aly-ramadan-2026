const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET all questions (with optional filters)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.episode) filter.episode = Number(req.query.episode);
        if (req.query.category) filter.category = req.query.category;
        if (req.query.difficulty) filter.difficulty = req.query.difficulty;
        if (req.query.used !== undefined) filter.used = req.query.used === 'true';

        const questions = await Question.find(filter).sort({ episode: 1, createdAt: -1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a random unused question (for skip feature)
router.get('/random', async (req, res) => {
    try {
        const filter = { used: false };
        if (req.query.episode) filter.episode = Number(req.query.episode);

        // Exclude already-used question IDs if provided
        if (req.query.exclude) {
            const excludeIds = req.query.exclude.split(',');
            filter._id = { $nin: excludeIds };
        }

        const count = await Question.countDocuments(filter);
        if (count === 0) {
            return res.status(404).json({ error: 'لا يوجد أسئلة متاحة' });
        }

        const random = Math.floor(Math.random() * count);
        const question = await Question.findOne(filter).skip(random);
        res.json(question);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET question stats
router.get('/stats', async (req, res) => {
    try {
        const total = await Question.countDocuments();
        const used = await Question.countDocuments({ used: true });
        const byEpisode = await Question.aggregate([
            { $group: { _id: '$episode', total: { $sum: 1 }, used: { $sum: { $cond: ['$used', 1, 0] } } } },
            { $sort: { _id: 1 } }
        ]);
        const byCategory = await Question.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({ total, used, unused: total - used, byEpisode, byCategory });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new question
router.post('/', async (req, res) => {
    try {
        const question = new Question(req.body);
        await question.save();
        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST bulk insert questions
router.post('/bulk', async (req, res) => {
    try {
        const questions = await Question.insertMany(req.body.questions);
        res.status(201).json({ inserted: questions.length, questions });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH mark question as used
router.patch('/:id/used', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            { used: true },
            { new: true }
        );
        if (!question) return res.status(404).json({ error: 'السؤال غير موجود' });
        res.json(question);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH reset all questions (mark as unused)
router.patch('/reset/all', async (req, res) => {
    try {
        const filter = {};
        if (req.query.episode) filter.episode = Number(req.query.episode);

        await Question.updateMany(filter, { used: false });
        res.json({ message: 'تم إعادة تعيين جميع الأسئلة' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a question
router.delete('/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ error: 'السؤال غير موجود' });
        res.json({ message: 'تم حذف السؤال' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update a question
router.put('/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!question) return res.status(404).json({ error: 'السؤال غير موجود' });
        res.json(question);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
