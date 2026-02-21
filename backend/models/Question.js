const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        trim: true
    }],
    answer: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['ديني', 'ثقافي', 'رياضي', 'علمي', 'تاريخي', 'عام'],
        default: 'عام'
    },
    episode: {
        type: Number,
        default: 1
    },
    difficulty: {
        type: String,
        enum: ['سهل', 'متوسط', 'صعب'],
        default: 'متوسط'
    },
    used: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for fast querying of unused questions per episode
questionSchema.index({ episode: 1, used: 1 });

module.exports = mongoose.model('Question', questionSchema);
