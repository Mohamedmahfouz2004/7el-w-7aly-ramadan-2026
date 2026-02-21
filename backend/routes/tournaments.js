const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');

// POST create a new tournament
router.post('/', async (req, res) => {
    try {
        const { name, teams, questionsPerMatch } = req.body;

        const tournament = new Tournament({
            name,
            teams: teams.map(t => ({
                name: t.name,
                players: t.players.map(p => ({ name: p.name || p, totalScore: 0, matchesPlayed: 0 }))
            })),
            questionsPerMatch: questionsPerMatch || 20
        });

        // Generate round-robin league fixtures
        tournament.generateLeagueFixtures();

        await tournament.save();
        res.status(201).json(tournament);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET all tournaments
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ createdAt: -1 });
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a tournament by ID
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });
        res.json(tournament);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET tournament standings
router.get('/:id/standings', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        const standings = tournament.getStandings();
        const knockoutStructure = tournament.getKnockoutStructure();

        res.json({
            phase: tournament.currentPhase,
            standings,
            knockoutStructure,
            totalMatches: tournament.leagueMatches.length,
            playedMatches: tournament.leagueMatches.filter(m => m.played).length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET top players
router.get('/:id/top-players', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        const topPlayers = tournament.getTopPlayers();
        res.json(topPlayers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET next unplayed match in league
router.get('/:id/next-match', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        if (tournament.currentPhase === 'league') {
            const nextMatch = tournament.leagueMatches.find(m => !m.played);
            if (!nextMatch) {
                return res.json({ message: 'كل مباريات الدوري انتهت', phase: 'knockout_ready' });
            }
            return res.json({
                team1: tournament.teams[nextMatch.team1Index],
                team2: tournament.teams[nextMatch.team2Index],
                matchIndex: tournament.leagueMatches.indexOf(nextMatch),
                totalMatches: tournament.leagueMatches.length,
                playedMatches: tournament.leagueMatches.filter(m => m.played).length
            });
        } else {
            const nextMatch = tournament.knockoutMatches.find(
                m => m.round === tournament.currentPhase && !m.played
            );
            if (!nextMatch) {
                return res.json({ message: 'الدور الحالي انتهى', phase: tournament.currentPhase });
            }
            return res.json({
                team1: tournament.teams[nextMatch.team1Index],
                team2: tournament.teams[nextMatch.team2Index],
                round: nextMatch.round
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST advance to knockout phase
router.post('/:id/advance-knockout', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        const structure = tournament.getKnockoutStructure();
        const standings = tournament.getStandings();

        // Get top teams that advance
        const advancingTeams = standings.slice(0, structure.advanceCount);
        const advancingIndexes = advancingTeams.map(t =>
            tournament.teams.findIndex(team => team._id.toString() === t._id.toString())
        );

        // Mark non-advancing teams as eliminated
        tournament.teams.forEach((team, idx) => {
            if (!advancingIndexes.includes(idx)) {
                team.eliminated = true;
            }
        });

        // Generate knockout matches (seeded: 1st vs last, 2nd vs 2nd last, etc.)
        const firstRound = structure.rounds[0];
        tournament.knockoutMatches = [];

        for (let i = 0; i < advancingIndexes.length / 2; i++) {
            tournament.knockoutMatches.push({
                round: firstRound,
                team1Index: advancingIndexes[i],
                team2Index: advancingIndexes[advancingIndexes.length - 1 - i],
                played: false
            });
        }

        tournament.currentPhase = firstRound;
        await tournament.save();

        res.json({
            message: `تم الانتقال إلى دور ${firstRound}`,
            knockoutMatches: tournament.knockoutMatches.map(m => ({
                team1: tournament.teams[m.team1Index].name,
                team2: tournament.teams[m.team2Index].name,
                round: m.round
            })),
            eliminatedTeams: tournament.teams.filter(t => t.eliminated).map(t => t.name)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST advance to next knockout round
router.post('/:id/next-round', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        const structure = tournament.getKnockoutStructure();
        const currentRoundIndex = structure.rounds.indexOf(tournament.currentPhase);

        if (currentRoundIndex === -1 || currentRoundIndex >= structure.rounds.length - 1) {
            // We're already at the final, check if it's done
            const finalMatch = tournament.knockoutMatches.find(m => m.round === 'final' && m.played);
            if (finalMatch) {
                tournament.currentPhase = 'completed';
                tournament.status = 'completed';
                await tournament.save();
                return res.json({ message: 'الدوري انتهى! 🏆', champion: tournament.teams[finalMatch.team1Index]?.name });
            }
            return res.status(400).json({ error: 'لسه النهائي ماتلعبش' });
        }

        // Get winners of current round
        const currentRoundMatches = tournament.knockoutMatches.filter(m => m.round === tournament.currentPhase);
        const allPlayed = currentRoundMatches.every(m => m.played);
        if (!allPlayed) {
            return res.status(400).json({ error: 'لسه فيه مباريات في الدور الحالي ماتلعبتش' });
        }

        const winnerIndexes = currentRoundMatches.map(m => {
            // Find match data to determine winner team index
            return Number(m.winnerId);
        });

        // Generate next round matches
        const nextRound = structure.rounds[currentRoundIndex + 1];
        for (let i = 0; i < winnerIndexes.length; i += 2) {
            tournament.knockoutMatches.push({
                round: nextRound,
                team1Index: winnerIndexes[i],
                team2Index: winnerIndexes[i + 1],
                played: false
            });
        }

        tournament.currentPhase = nextRound;
        await tournament.save();

        res.json({
            message: `تم الانتقال إلى ${nextRound}`,
            matches: tournament.knockoutMatches
                .filter(m => m.round === nextRound)
                .map(m => ({
                    team1: tournament.teams[m.team1Index].name,
                    team2: tournament.teams[m.team2Index].name
                }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a tournament
router.delete('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'الدوري غير موجود' });

        // Also delete all related matches
        await Match.deleteMany({ tournament: req.params.id });

        res.json({ message: 'تم حذف الدوري' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
