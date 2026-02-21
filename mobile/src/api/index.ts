import { localApi } from './localApi';

// Set to TRUE for offline mode (no internet/server needed)
// Set to FALSE for cloud mode (Vercel + MongoDB Atlas)
export const IS_OFFLINE = true;

// Cloud Backend URL
export const API_BASE = 'https://7el-w-7aly-ramadan-2026.vercel.app';

const handleResponse = async (r: Response) => {
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${r.status}`);
    }
    return r.json();
};

export const api = {
    // Questions
    getQuestions: (params?: Record<string, string>) => {
        if (IS_OFFLINE) return localApi.getQuestions(params);
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetch(`${API_BASE}/api/questions${query}`).then(handleResponse);
    },
    getQuestionStats: () => {
        if (IS_OFFLINE) return localApi.getQuestionStats();
        return fetch(`${API_BASE}/api/questions/stats`).then(handleResponse);
    },
    addQuestion: (data: any) => {
        if (IS_OFFLINE) return localApi.addQuestion(data);
        return fetch(`${API_BASE}/api/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    deleteQuestion: (id: string) => {
        if (IS_OFFLINE) return localApi.deleteQuestion(id);
        return fetch(`${API_BASE}/api/questions/${id}`, { method: 'DELETE' }).then(handleResponse);
    },
    resetQuestions: (episode?: number) => {
        if (IS_OFFLINE) return localApi.resetQuestions(episode);
        const query = episode ? `?episode=${episode}` : '';
        return fetch(`${API_BASE}/api/questions/reset/all${query}`, { method: 'PATCH' }).then(handleResponse);
    },

    // Tournaments
    getTournaments: () => {
        if (IS_OFFLINE) return localApi.getTournaments();
        return fetch(`${API_BASE}/api/tournaments`).then(handleResponse);
    },
    getTournament: (id: string) => {
        if (IS_OFFLINE) return localApi.getTournament(id);
        return fetch(`${API_BASE}/api/tournaments/${id}`).then(handleResponse);
    },
    createTournament: (data: any) => {
        if (IS_OFFLINE) return localApi.createTournament(data);
        return fetch(`${API_BASE}/api/tournaments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    getStandings: (id: string) => {
        if (IS_OFFLINE) return localApi.getStandings(id);
        return fetch(`${API_BASE}/api/tournaments/${id}/standings`).then(handleResponse);
    },
    getTopPlayers: (id: string) => {
        if (IS_OFFLINE) return localApi.getTopPlayers(id);
        return fetch(`${API_BASE}/api/tournaments/${id}/top-players`).then(handleResponse);
    },
    getNextMatch: (id: string) => {
        if (IS_OFFLINE) return localApi.getNextMatch(id);
        return fetch(`${API_BASE}/api/tournaments/${id}/next-match`).then(handleResponse);
    },
    advanceKnockout: (id: string) => {
        return fetch(`${API_BASE}/api/tournaments/${id}/advance-knockout`, { method: 'POST' }).then(handleResponse);
    },
    nextRound: (id: string) => {
        return fetch(`${API_BASE}/api/tournaments/${id}/next-round`, { method: 'POST' }).then(handleResponse);
    },

    // Matches
    createMatch: (data: any) => {
        if (IS_OFFLINE) return localApi.createMatch(data);
        return fetch(`${API_BASE}/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    answerQuestion: (id: string, data: any) => {
        if (IS_OFFLINE) return localApi.answerQuestion(id, data);
        return fetch(`${API_BASE}/api/matches/${id}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    skipQuestion: (id: string) => {
        return fetch(`${API_BASE}/api/matches/${id}/skip`, { method: 'POST' }).then(handleResponse);
    },
    finishMatch: (id: string) => {
        if (IS_OFFLINE) return localApi.finishMatch(id);
        return fetch(`${API_BASE}/api/matches/${id}/finish`, { method: 'POST' }).then(handleResponse);
    },
};
