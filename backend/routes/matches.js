const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Question = require('../models/Question');

// POST create a new match
router.post('/', async (req, res) => {
    try {
        const { tournamentId, team1, team2, totalQuestions, episode, round } = req.body;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        const match = new Match({
            tournament: tournamentId,
            team1: {
                teamId: team1._id || team1.teamId,
                name: team1.name,
                players: team1.players.map(p => ({ name: p.name, score: 0 })),
                score: 0
            },
            team2: {
                teamId: team2._id || team2.teamId,
                name: team2.name,
                players: team2.players.map(p => ({ name: p.name, score: 0 })),
                score: 0
            },
            totalQuestions: totalQuestions || tournament.questionsPerMatch,
            episode: episode || 1,
            round: round || 'league',
            status: 'setup'
        });

        await match.save();
        res.status(201).json(match);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET match by ID
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id).populate('currentQuestion');
        if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });
        res.json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST start match / get first question
router.post('/:id/start', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });

        // Get a random unused question
        const question = await getRandomQuestion(match.episode, match.usedQuestionIds);
        if (!question) {
            return res.status(404).json({ error: 'مفيش أسئلة متاحة للحلقة دي' });
        }

        match.currentQuestion = question._id;
        match.usedQuestionIds.push(question._id);
        match.status = 'playing';
        await match.save();

        res.json({
            match,
            question: {
                _id: question._id,
                text: question.text,
                options: question.options,
                answer: question.answer,
                category: question.category,
                difficulty: question.difficulty
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST answer a question (correct or incorrect)
router.post('/:id/answer', async (req, res) => {
    try {
        const { teamSide, playerIndex, correct } = req.body;
        // teamSide: 'team1' or 'team2'
        // playerIndex: index of the player who answered
        // correct: true/false

        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });
        if (match.status !== 'playing') return res.status(400).json({ error: 'المباراة مش شغالة' });

        const team = match[teamSide];
        if (!team) return res.status(400).json({ error: 'تيم غير صحيح' });

        if (correct) {
            team.score += 1;
            if (team.players[playerIndex]) {
                team.players[playerIndex].score += 1;
            }
        } else {
            team.score -= 1;
        }

        // Mark question as used in DB
        await Question.findByIdAndUpdate(match.currentQuestion, { used: true });

        // Increment questions asked
        match.questionsAsked += 1;

        // Check if match is over
        if (match.questionsAsked >= match.totalQuestions) {
            match.status = 'finished';

            // Determine winner
            if (match.team1.score > match.team2.score) {
                match.winner = match.team1.name;
            } else if (match.team2.score > match.team1.score) {
                match.winner = match.team2.name;
            } else {
                match.winner = 'تعادل';
            }

            // Determine best player
            const allPlayers = [
                ...match.team1.players.map(p => ({ ...p.toObject(), team: match.team1.name })),
                ...match.team2.players.map(p => ({ ...p.toObject(), team: match.team2.name }))
            ];
            const best = allPlayers.reduce((a, b) => a.score > b.score ? a : b);
            match.bestPlayer = { name: best.name, team: best.team, score: best.score };

            await match.save();

            return res.json({
                match,
                finished: true,
                winner: match.winner,
                bestPlayer: match.bestPlayer
            });
        }

        // Get next question
        const nextQuestion = await getRandomQuestion(match.episode, match.usedQuestionIds);
        if (!nextQuestion) {
            // No more questions available, end the match
            match.status = 'finished';
            if (match.team1.score > match.team2.score) match.winner = match.team1.name;
            else if (match.team2.score > match.team1.score) match.winner = match.team2.name;
            else match.winner = 'تعادل';

            const allPlayers = [
                ...match.team1.players.map(p => ({ ...p.toObject(), team: match.team1.name })),
                ...match.team2.players.map(p => ({ ...p.toObject(), team: match.team2.name }))
            ];
            const best = allPlayers.reduce((a, b) => a.score > b.score ? a : b);
            match.bestPlayer = { name: best.name, team: best.team, score: best.score };

            await match.save();
            return res.json({ match, finished: true, winner: match.winner, bestPlayer: match.bestPlayer, noMoreQuestions: true });
        }

        match.currentQuestion = nextQuestion._id;
        match.usedQuestionIds.push(nextQuestion._id);
        await match.save();

        res.json({
            match,
            finished: false,
            question: {
                _id: nextQuestion._id,
                text: nextQuestion.text,
                options: nextQuestion.options,
                answer: nextQuestion.answer,
                category: nextQuestion.category,
                difficulty: nextQuestion.difficulty
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST skip question (get a new one, doesn't count)
router.post('/:id/skip', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });
        if (match.status !== 'playing') return res.status(400).json({ error: 'المباراة مش شغالة' });

        // DON'T increment questionsAsked - skip doesn't count!
        const nextQuestion = await getRandomQuestion(match.episode, match.usedQuestionIds);
        if (!nextQuestion) {
            return res.status(404).json({ error: 'مفيش أسئلة تانية متاحة' });
        }

        match.currentQuestion = nextQuestion._id;
        match.usedQuestionIds.push(nextQuestion._id);
        await match.save();

        res.json({
            match,
            question: {
                _id: nextQuestion._id,
                text: nextQuestion.text,
                options: nextQuestion.options,
                answer: nextQuestion.answer,
                category: nextQuestion.category,
                difficulty: nextQuestion.difficulty
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST finish match and update tournament
router.post('/:id/finish', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });

        if (match.status !== 'finished') {
            // Force finish
            match.status = 'finished';
            if (match.team1.score > match.team2.score) match.winner = match.team1.name;
            else if (match.team2.score > match.team1.score) match.winner = match.team2.name;
            else match.winner = 'تعادل';

            const allPlayers = [
                ...match.team1.players.map(p => ({ ...p.toObject(), team: match.team1.name })),
                ...match.team2.players.map(p => ({ ...p.toObject(), team: match.team2.name }))
            ];
            if (allPlayers.length > 0) {
                const best = allPlayers.reduce((a, b) => a.score > b.score ? a : b);
                match.bestPlayer = { name: best.name, team: best.team, score: best.score };
            }
            await match.save();
        }

        // Update tournament standings
        const tournament = await Tournament.findById(match.tournament);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        // Find teams in tournament
        const t1 = tournament.teams.find(t => t._id.toString() === match.team1.teamId || t.name === match.team1.name);
        const t2 = tournament.teams.find(t => t._id.toString() === match.team2.teamId || t.name === match.team2.name);

        if (t1 && t2) {
            // Update goals
            t1.goalsFor += match.team1.score;
            t1.goalsAgainst += match.team2.score;
            t2.goalsFor += match.team2.score;
            t2.goalsAgainst += match.team1.score;

            // Update wins/losses/draws and points
            if (match.team1.score > match.team2.score) {
                t1.wins += 1;
                t1.points += 3;
                t2.losses += 1;
            } else if (match.team2.score > match.team1.score) {
                t2.wins += 1;
                t2.points += 3;
                t1.losses += 1;
            } else {
                t1.draws += 1;
                t2.draws += 1;
                t1.points += 1;
                t2.points += 1;
            }

            // Update player stats in tournament
            match.team1.players.forEach(mp => {
                const tp = t1.players.find(p => p.name === mp.name);
                if (tp) {
                    tp.totalScore += mp.score;
                    tp.matchesPlayed += 1;
                }
            });
            match.team2.players.forEach(mp => {
                const tp = t2.players.find(p => p.name === mp.name);
                if (tp) {
                    tp.totalScore += mp.score;
                    tp.matchesPlayed += 1;
                }
            });
        }

        // Mark league match as played
        if (match.round === 'league') {
            const lm = tournament.leagueMatches.find(m =>
                !m.played && (
                    (tournament.teams[m.team1Index]?.name === match.team1.name && tournament.teams[m.team2Index]?.name === match.team2.name) ||
                    (tournament.teams[m.team1Index]?.name === match.team2.name && tournament.teams[m.team2Index]?.name === match.team1.name)
                )
            );
            if (lm) {
                lm.played = true;
                lm.matchId = match._id;
            }
        } else {
            // Mark knockout match as played
            const km = tournament.knockoutMatches.find(m =>
                m.round === match.round && !m.played && (
                    (tournament.teams[m.team1Index]?.name === match.team1.name && tournament.teams[m.team2Index]?.name === match.team2.name) ||
                    (tournament.teams[m.team1Index]?.name === match.team2.name && tournament.teams[m.team2Index]?.name === match.team1.name)
                )
            );
            if (km) {
                km.played = true;
                km.matchId = match._id;
                // Store winner index for knockout advancement
                const winnerTeam = match.team1.score >= match.team2.score ? match.team1 : match.team2;
                const winnerIdx = tournament.teams.findIndex(t => t.name === winnerTeam.name);
                km.winnerId = String(winnerIdx);
            }
        }

        await tournament.save();

        res.json({
            message: 'تم تسجيل النتيجة في الدوري',
            match,
            standings: tournament.getStandings()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper: Get a random question not in usedIds
async function getRandomQuestion(episode, usedIds) {
    const filter = {
        _id: { $nin: usedIds }
    };
    // If episode is specified, try to get from that episode first
    if (episode) {
        filter.episode = episode;
    }

    const count = await Question.countDocuments(filter);
    if (count === 0) {
        // If no questions for this episode, try any episode
        delete filter.episode;
        const anyCount = await Question.countDocuments(filter);
        if (anyCount === 0) return null;
        const random = Math.floor(Math.random() * anyCount);
        return Question.findOne(filter).skip(random);
    }

    const random = Math.floor(Math.random() * count);
    return Question.findOne(filter).skip(random);
}

module.exports = router;
