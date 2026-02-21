import { Platform } from 'react-native';

// Cloud Backend URL (Vercel)
const getBaseUrl = () => {
    return 'https://7el-w-7aly-ramadan-2026.vercel.app';
};

export const API_BASE = getBaseUrl();

export const api = {
    // Questions
    getQuestions: (params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetch(`${API_BASE}/api/questions${query}`).then(r => r.json());
    },
    getQuestionStats: () =>
        fetch(`${API_BASE}/api/questions/stats`).then(r => r.json()),
    addQuestion: (data: any) =>
        fetch(`${API_BASE}/api/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()),
    addBulkQuestions: (questions: any[]) =>
        fetch(`${API_BASE}/api/questions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions }),
        }).then(r => r.json()),
    deleteQuestion: (id: string) =>
        fetch(`${API_BASE}/api/questions/${id}`, { method: 'DELETE' }).then(r => r.json()),
    resetQuestions: (episode?: number) => {
        const query = episode ? `?episode=${episode}` : '';
        return fetch(`${API_BASE}/api/questions/reset/all${query}`, { method: 'PATCH' }).then(r => r.json());
    },

    // Tournaments
    getTournaments: () =>
        fetch(`${API_BASE}/api/tournaments`).then(r => r.json()),
    getTournament: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}`).then(r => r.json()),
    createTournament: (data: any) =>
        fetch(`${API_BASE}/api/tournaments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()),
    getStandings: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}/standings`).then(r => r.json()),
    getTopPlayers: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}/top-players`).then(r => r.json()),
    getNextMatch: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}/next-match`).then(r => r.json()),
    advanceKnockout: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}/advance-knockout`, { method: 'POST' }).then(r => r.json()),
    nextRound: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}/next-round`, { method: 'POST' }).then(r => r.json()),
    deleteTournament: (id: string) =>
        fetch(`${API_BASE}/api/tournaments/${id}`, { method: 'DELETE' }).then(r => r.json()),

    // Matches
    createMatch: (data: any) =>
        fetch(`${API_BASE}/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()),
    getMatch: (id: string) =>
        fetch(`${API_BASE}/api/matches/${id}`).then(r => r.json()),
    startMatch: (id: string) =>
        fetch(`${API_BASE}/api/matches/${id}/start`, { method: 'POST' }).then(r => r.json()),
    answerQuestion: (id: string, data: { teamSide: string; playerIndex: number; correct: boolean }) =>
        fetch(`${API_BASE}/api/matches/${id}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()),
    skipQuestion: (id: string) =>
        fetch(`${API_BASE}/api/matches/${id}/skip`, { method: 'POST' }).then(r => r.json()),
    finishMatch: (id: string) =>
        fetch(`${API_BASE}/api/matches/${id}/finish`, { method: 'POST' }).then(r => r.json()),
};
