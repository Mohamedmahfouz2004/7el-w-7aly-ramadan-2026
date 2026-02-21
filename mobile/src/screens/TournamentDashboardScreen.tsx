import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

export default function TournamentDashboardScreen({ route, navigation }: any) {
    const { tournamentId } = route.params;
    const [tournament, setTournament] = useState<any>(null);
    const [standings, setStandings] = useState<any>(null);
    const [topPlayers, setTopPlayers] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<'standings' | 'players' | 'matches'>('standings');

    const loadData = useCallback(async () => {
        try {
            const [t, s, p] = await Promise.all([
                api.getTournament(tournamentId),
                api.getStandings(tournamentId),
                api.getTopPlayers(tournamentId),
            ]);
            setTournament(t);
            setStandings(s);
            setTopPlayers(p);
        } catch (err) {
            console.error(err);
        }
    }, [tournamentId]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleStartMatch = async () => {
        try {
            const nextMatch = await api.getNextMatch(tournamentId);
            if (nextMatch.message) {
                // League is done
                if (nextMatch.phase === 'knockout_ready') {
                    Alert.alert('🏆 دور المجموعات انتهى!', 'عايز تبدأ الأدوار الإقصائية؟', [
                        { text: 'لأ', style: 'cancel' },
                        {
                            text: 'آه يلا!',
                            onPress: async () => {
                                await api.advanceKnockout(tournamentId);
                                loadData();
                            },
                        },
                    ]);
                } else {
                    // Check if current knockout round is done
                    Alert.alert('الدور انتهى', 'عايز تنتقل للدور التالي؟', [
                        { text: 'لأ', style: 'cancel' },
                        {
                            text: 'آه',
                            onPress: async () => {
                                try {
                                    const result = await api.nextRound(tournamentId);
                                    Alert.alert('🎉', result.message);
                                    loadData();
                                } catch (e: any) {
                                    Alert.alert('خطأ', e.message);
                                }
                            },
                        },
                    ]);
                }
                return;
            }

            // Create and start the match
            const match = await api.createMatch({
                tournamentId,
                team1: nextMatch.team1,
                team2: nextMatch.team2,
                totalQuestions: tournament.questionsPerMatch,
                episode: (standings?.playedMatches || 0) + 1,
                round: tournament.currentPhase,
            });

            navigation.navigate('Game', { matchId: match._id });
        } catch (err: any) {
            Alert.alert('خطأ', err.message);
        }
    };

    if (!tournament) {
        return (
            <LinearGradient colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.gold, fontSize: FontSizes.xl }}>جاري التحميل...</Text>
            </LinearGradient>
        );
    }

    const phaseLabels: Record<string, string> = {
        league: 'دور المجموعات',
        quarter: 'ربع النهائي',
        semi: 'نصف النهائي',
        final: 'النهائي',
        completed: 'انتهى الدوري 🏆',
    };

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-forward" size={24} color={Colors.gold} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={styles.title}>{tournament.name}</Text>
                        <Text style={styles.phase}>{phaseLabels[tournament.currentPhase]}</Text>
                    </View>
                </View>

                {/* Progress Card */}
                {standings && (
                    <View style={styles.progressCard}>
                        <Text style={styles.progressText}>
                            {standings.playedMatches} / {standings.totalMatches} مباراة
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(standings.playedMatches / standings.totalMatches) * 100}%` }]} />
                        </View>
                    </View>
                )}

                {/* Start Match Button */}
                {tournament.status !== 'completed' && (
                    <TouchableOpacity style={styles.startMatchBtn} onPress={handleStartMatch} activeOpacity={0.8}>
                        <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.startMatchGradient}>
                            <Ionicons name="play-circle" size={24} color={Colors.primaryDark} />
                            <Text style={styles.startMatchText}>ابدأ المباراة التالية</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Tabs */}
                <View style={styles.tabs}>
                    {(['standings', 'players', 'matches'] as const).map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tab, tab === t && styles.activeTab]}
                            onPress={() => setTab(t)}
                        >
                            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                                {t === 'standings' ? 'الترتيب' : t === 'players' ? 'أحسن لاعب' : 'المباريات'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Standings Tab */}
                {tab === 'standings' && standings && (
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>الفريق</Text>
                            <Text style={styles.th}>لعب</Text>
                            <Text style={styles.th}>فوز</Text>
                            <Text style={styles.th}>خسارة</Text>
                            <Text style={styles.th}>تعادل</Text>
                            <Text style={[styles.th, { color: Colors.gold }]}>نقاط</Text>
                        </View>
                        {standings.standings.map((team: any, index: number) => (
                            <View key={index} style={[styles.tableRow, index < (standings.knockoutStructure?.advanceCount || 4) && styles.qualifiedRow]}>
                                <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{index + 1}</Text>
                                <Text style={[styles.td, { flex: 2, textAlign: 'right', fontWeight: '600' }]}>{team.name}</Text>
                                <Text style={styles.td}>{team.wins + team.losses + team.draws}</Text>
                                <Text style={[styles.td, { color: Colors.correct }]}>{team.wins}</Text>
                                <Text style={[styles.td, { color: Colors.incorrect }]}>{team.losses}</Text>
                                <Text style={styles.td}>{team.draws}</Text>
                                <Text style={[styles.td, { color: Colors.gold, fontWeight: 'bold' }]}>{team.points}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Top Players Tab */}
                {tab === 'players' && (
                    <View style={styles.tableCard}>
                        {topPlayers.map((player: any, index: number) => (
                            <View key={index} style={styles.playerRow}>
                                <Text style={styles.playerScore}>{player.score}</Text>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>
                                        {index === 0 ? '👑 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}{player.name}
                                    </Text>
                                    <Text style={styles.playerTeam}>{player.team} • {player.matchesPlayed} مباراة</Text>
                                </View>
                                <Text style={styles.playerRank}>#{index + 1}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Matches Tab */}
                {tab === 'matches' && (
                    <View style={styles.tableCard}>
                        {tournament.currentPhase === 'league' ? (
                            tournament.leagueMatches.map((m: any, index: number) => (
                                <View key={index} style={[styles.matchRow, m.played && styles.playedMatch]}>
                                    <Text style={styles.matchStatus}>{m.played ? '✅' : '⏳'}</Text>
                                    <Text style={styles.matchTeams}>
                                        {tournament.teams[m.team1Index]?.name} vs {tournament.teams[m.team2Index]?.name}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            tournament.knockoutMatches
                                .filter((m: any) => m.round === tournament.currentPhase)
                                .map((m: any, index: number) => (
                                    <View key={index} style={[styles.matchRow, m.played && styles.playedMatch]}>
                                        <Text style={styles.matchStatus}>{m.played ? '✅' : '⏳'}</Text>
                                        <Text style={styles.matchTeams}>
                                            {tournament.teams[m.team1Index]?.name} vs {tournament.teams[m.team2Index]?.name}
                                        </Text>
                                        <Text style={styles.matchRound}>{phaseLabels[m.round]}</Text>
                                    </View>
                                ))
                        )}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: 40 },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.cardBg,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.gold },
    phase: { fontSize: FontSizes.sm, color: Colors.emerald, marginTop: 2 },
    progressCard: {
        backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    progressText: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.sm },
    progressBar: {
        height: 6, backgroundColor: Colors.primaryDark, borderRadius: 3,
    },
    progressFill: {
        height: '100%', backgroundColor: Colors.gold, borderRadius: 3,
    },
    startMatchBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
    startMatchGradient: {
        flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
        gap: Spacing.sm, padding: Spacing.lg,
    },
    startMatchText: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primaryDark },
    tabs: {
        flexDirection: 'row-reverse', gap: Spacing.sm, marginBottom: Spacing.md,
    },
    tab: {
        flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center',
        backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    activeTab: { backgroundColor: Colors.gold + '20', borderColor: Colors.gold },
    tabText: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600' },
    activeTabText: { color: Colors.gold },
    tableCard: {
        backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
        padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    tableHeader: {
        flexDirection: 'row', paddingVertical: Spacing.sm,
        borderBottomWidth: 2, borderBottomColor: Colors.gold + '30',
    },
    th: {
        flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row', paddingVertical: Spacing.sm,
        borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    qualifiedRow: {
        backgroundColor: Colors.emerald + '10',
    },
    td: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight, textAlign: 'center' },
    playerRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
        borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    playerRank: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.gold, width: 35 },
    playerInfo: { flex: 1, alignItems: 'flex-end', marginHorizontal: Spacing.sm },
    playerName: { fontSize: FontSizes.md, color: Colors.white, fontWeight: '600' },
    playerTeam: { fontSize: FontSizes.xs, color: Colors.textMuted },
    playerScore: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.emerald, width: 40, textAlign: 'center' },
    matchRow: {
        flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
        paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    playedMatch: { opacity: 0.6 },
    matchStatus: { fontSize: FontSizes.md },
    matchTeams: { flex: 1, fontSize: FontSizes.md, color: Colors.textLight, textAlign: 'right' },
    matchRound: { fontSize: FontSizes.xs, color: Colors.gold },
});
