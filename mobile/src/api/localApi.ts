import AsyncStorage from '@react-native-async-storage/async-storage';

const QUESTIONS_KEY = '@7el_w_7aly_questions';
const TOURNAMENTS_KEY = '@7el_w_7aly_tournaments';
const MATCHES_KEY = '@7el_w_7aly_matches';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export const localApi = {
    // Questions
    getQuestions: async (params?: Record<string, any>) => {
        const data = await AsyncStorage.getItem(QUESTIONS_KEY);
        let questions = data ? JSON.parse(data) : [];

        if (params?.episode) {
            questions = questions.filter((q: any) => q.episode === parseInt(params.episode));
        }
        if (params?.category) {
            questions = questions.filter((q: any) => q.category === params.category);
        }

        return questions;
    },

    getQuestionStats: async () => {
        const questions = await localApi.getQuestions();
        return {
            total: questions.length,
            unused: questions.filter((q: any) => !q.used).length,
            used: questions.filter((q: any) => q.used).length,
        };
    },

    addQuestion: async (question: any) => {
        const questions = await localApi.getQuestions();
        const newQuestion = {
            ...question,
            _id: generateId(),
            used: false,
            createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(QUESTIONS_KEY, JSON.stringify([...questions, newQuestion]));
        return newQuestion;
    },

    deleteQuestion: async (id: string) => {
        const questions = await localApi.getQuestions();
        const filtered = questions.filter((q: any) => q._id !== id);
        await AsyncStorage.setItem(QUESTIONS_KEY, JSON.stringify(filtered));
        return { success: true };
    },

    resetQuestions: async (episode?: number) => {
        const questions = await localApi.getQuestions();
        const updated = questions.map((q: any) => {
            if (!episode || q.episode === episode) {
                return { ...q, used: false };
            }
            return q;
        });
        await AsyncStorage.setItem(QUESTIONS_KEY, JSON.stringify(updated));
        return { success: true };
    },

    // Tournaments
    getTournaments: async () => {
        const data = await AsyncStorage.getItem(TOURNAMENTS_KEY);
        return data ? JSON.parse(data) : [];
    },

    getTournament: async (id: string) => {
        const tournaments = await localApi.getTournaments();
        return tournaments.find((t: any) => t._id === id);
    },

    createTournament: async (data: any) => {
        const tournaments = await localApi.getTournaments();
        const newTournament = {
            ...data,
            _id: generateId(),
            status: 'active',
            currentPhase: 'league',
            leagueMatches: [],
            knockoutMatches: [],
            createdAt: new Date().toISOString(),
        };

        // Initialize league fixtures
        const n = newTournament.teams.length;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                newTournament.leagueMatches.push({
                    team1Index: i,
                    team2Index: j,
                    played: false
                });
            }
        }

        await AsyncStorage.setItem(TOURNAMENTS_KEY, JSON.stringify([...tournaments, newTournament]));
        return newTournament;
    },

    getStandings: async (id: string) => {
        const tournament = await localApi.getTournament(id);
        if (!tournament) throw new Error('Tournament not found');

        // Simple standings calculation
        const standings = tournament.teams.map((team: any, index: number) => ({
            ...team,
            _id: index.toString(), // Temp ID for mapping
            points: team.points || 0,
            wins: team.wins || 0,
            losses: team.losses || 0,
            draws: team.draws || 0,
            goalsFor: team.goalsFor || 0,
            goalsAgainst: team.goalsAgainst || 0,
        }));

        return {
            phase: tournament.currentPhase,
            standings: standings.sort((a: any, b: any) => b.points - a.points),
            totalMatches: tournament.leagueMatches.length,
            playedMatches: tournament.leagueMatches.filter((m: any) => m.played).length,
        };
    },

    getTopPlayers: async (id: string) => {
        const tournament = await localApi.getTournament(id);
        const players: any[] = [];
        tournament.teams.forEach((team: any) => {
            team.players.forEach((p: any) => {
                players.push({
                    name: p.name,
                    team: team.name,
                    score: p.totalScore || 0,
                    matchesPlayed: p.matchesPlayed || 0,
                });
            });
        });
        return players.sort((a, b) => b.score - a.score);
    },

    getNextMatch: async (id: string) => {
        const tournament = await localApi.getTournament(id);
        if (tournament.currentPhase === 'league') {
            const nextIdx = tournament.leagueMatches.findIndex((m: any) => !m.played);
            if (nextIdx === -1) return { message: 'League finished', phase: 'knockout_ready' };
            const m = tournament.leagueMatches[nextIdx];
            return {
                team1: tournament.teams[m.team1Index],
                team2: tournament.teams[m.team2Index],
                matchIndex: nextIdx,
            };
        }
        return { message: 'Phase not supported yet in offline' };
    },

    // Matches
    createMatch: async (data: any) => {
        const matches = JSON.parse(await AsyncStorage.getItem(MATCHES_KEY) || '[]');
        const newMatch = {
            ...data,
            _id: generateId(),
            status: 'playing',
            currentQuestion: 1,
            questionsAsked: [],
            team1: { ...data.team1, score: 0 },
            team2: { ...data.team2, score: 0 },
        };
        await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify([...matches, newMatch]));
        return newMatch;
    },

    getMatch: async (id: string) => {
        const matches = JSON.parse(await AsyncStorage.getItem(MATCHES_KEY) || '[]');
        return matches.find((m: any) => m._id === id);
    },

    answerQuestion: async (id: string, { teamSide, playerIndex, correct }: any) => {
        const matches = JSON.parse(await AsyncStorage.getItem(MATCHES_KEY) || '[]');
        const matchIdx = matches.findIndex((m: any) => m._id === id);
        const match = matches[matchIdx];

        const team = teamSide === 'team1' ? match.team1 : match.team2;
        if (correct) {
            team.score += 1;
        } else {
            team.score -= 1;
        }

        match.currentQuestion += 1;
        await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        return match;
    },

    finishMatch: async (id: string) => {
        const matches = JSON.parse(await AsyncStorage.getItem(MATCHES_KEY) || '[]');
        const matchIdx = matches.findIndex((m: any) => m._id === id);
        const match = matches[matchIdx];
        match.status = 'finished';

        // Update tournament standings (simplified)
        const tournaments = await localApi.getTournaments();
        const tIdx = tournaments.findIndex((t: any) => t._id === match.tournamentId);
        const t = tournaments[tIdx];

        const team1 = t.teams.find((team: any) => team.name === match.team1.name);
        const team2 = t.teams.find((team: any) => team.name === match.team2.name);

        if (match.team1.score > match.team2.score) {
            team1.wins = (team1.wins || 0) + 1;
            team1.points = (team1.points || 0) + 3;
            team2.losses = (team2.losses || 0) + 1;
        } else if (match.team1.score < match.team2.score) {
            team2.wins = (team2.wins || 0) + 1;
            team2.points = (team2.points || 0) + 3;
            team1.losses = (team1.losses || 0) + 1;
        } else {
            team1.draws = (team1.draws || 0) + 1;
            team1.points = (team1.points || 0) + 1;
            team2.draws = (team2.draws || 0) + 1;
            team2.points = (team2.points || 0) + 1;
        }

        // Mark match as played in tournament
        const leagueMatch = t.leagueMatches.find((lm: any) =>
            (lm.team1Index === t.teams.indexOf(team1) && lm.team2Index === t.teams.indexOf(team2)) ||
            (lm.team1Index === t.teams.indexOf(team2) && lm.team2Index === t.teams.indexOf(team1))
        );
        if (leagueMatch) leagueMatch.played = true;

        await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        await AsyncStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
        return match;
    }
};
