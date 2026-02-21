const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    score: { type: Number, default: 0 }
});

const teamInMatchSchema = new mongoose.Schema({
    teamId: { type: String, required: true },
    name: { type: String, required: true },
    players: [playerSchema],
    score: { type: Number, default: 0 }
});

const matchSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    team1: { type: teamInMatchSchema, required: true },
    team2: { type: teamInMatchSchema, required: true },
    episode: { type: Number, default: 1 },
    totalQuestions: { type: Number, required: true },
    questionsAsked: { type: Number, default: 0 },
    usedQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    currentQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        default: null
    },
    round: {
        type: String,
        enum: ['league', 'quarter', 'semi', 'final'],
        default: 'league'
    },
    status: {
        type: String,
        enum: ['setup', 'playing', 'finished'],
        default: 'setup'
    },
    winner: { type: String, default: null },
    bestPlayer: {
        name: String,
        team: String,
        score: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
