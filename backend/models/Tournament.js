const mongoose = require('mongoose');

const teamPlayerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    totalScore: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 }
});

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    players: [teamPlayerSchema],
    points: { type: Number, default: 0 },       // League points
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },      // Total score (like goals in football)
    goalsAgainst: { type: Number, default: 0 },   // Total score conceded
    eliminated: { type: Boolean, default: false }
});

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    teams: [teamSchema],
    questionsPerMatch: { type: Number, default: 20 },
    currentPhase: {
        type: String,
        enum: ['league', 'quarter', 'semi', 'final', 'completed'],
        default: 'league'
    },
    leagueMatches: [{
        team1Index: Number,
        team2Index: Number,
        played: { type: Boolean, default: false },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }
    }],
    knockoutMatches: [{
        round: String,        // 'quarter', 'semi', 'final'
        team1Index: Number,
        team2Index: Number,
        played: { type: Boolean, default: false },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
        winnerId: String
    }],
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    }
}, { timestamps: true });

// Method to generate league fixtures (round-robin)
tournamentSchema.methods.generateLeagueFixtures = function () {
    const n = this.teams.length;
    this.leagueMatches = [];

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            this.leagueMatches.push({
                team1Index: i,
                team2Index: j,
                played: false
            });
        }
    }
};

// Method to determine knockout structure based on team count
tournamentSchema.methods.getKnockoutStructure = function () {
    const n = this.teams.length;

    if (n <= 2) {
        return { advanceCount: 2, rounds: ['final'] };
    } else if (n <= 4) {
        return { advanceCount: 4, rounds: ['semi', 'final'] };
    } else if (n <= 8) {
        return { advanceCount: Math.min(n, 8), rounds: ['quarter', 'semi', 'final'] };
    } else {
        // For larger tournaments, top 8 advance
        return { advanceCount: 8, rounds: ['quarter', 'semi', 'final'] };
    }
};

// Method to get sorted standings
tournamentSchema.methods.getStandings = function () {
    return [...this.teams]
        .filter(t => !t.eliminated || this.currentPhase === 'league')
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const aDiff = a.goalsFor - a.goalsAgainst;
            const bDiff = b.goalsFor - b.goalsAgainst;
            if (bDiff !== aDiff) return bDiff - aDiff;
            return b.goalsFor - a.goalsFor;
        });
};

// Method to get top players across all teams
tournamentSchema.methods.getTopPlayers = function () {
    const players = [];
    this.teams.forEach(team => {
        team.players.forEach(player => {
            players.push({
                name: player.name,
                team: team.name,
                score: player.totalScore,
                matchesPlayed: player.matchesPlayed,
                avgScore: player.matchesPlayed > 0
                    ? (player.totalScore / player.matchesPlayed).toFixed(2)
                    : 0
            });
        });
    });
    return players.sort((a, b) => b.score - a.score);
};

module.exports = mongoose.model('Tournament', tournamentSchema);
