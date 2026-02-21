import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

export default function MatchResultsScreen({ route, navigation }: any) {
    const { matchId, tournamentId } = route.params;
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadMatch();
    }, []);

    const loadMatch = async () => {
        try {
            const result = await api.getMatch(matchId);
            setMatch(result);

            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFinishAndRecord = async () => {
        try {
            await api.finishMatch(matchId);
            navigation.replace('TournamentDashboard', { tournamentId });
        } catch (err: any) {
            console.error(err);
            navigation.replace('TournamentDashboard', { tournamentId });
        }
    };

    if (loading || !match) {
        return (
            <LinearGradient colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.gold, fontSize: FontSizes.xl }}>جاري التحميل...</Text>
            </LinearGradient>
        );
    }

    const isDraw = match.team1.score === match.team2.score;
    const winner = match.team1.score > match.team2.score ? match.team1 : match.team2;
    const loser = match.team1.score > match.team2.score ? match.team2 : match.team1;

    // Get all players sorted by score
    const allPlayers = [
        ...match.team1.players.map((p: any) => ({ ...p, team: match.team1.name })),
        ...match.team2.players.map((p: any) => ({ ...p, team: match.team2.name })),
    ].sort((a, b) => b.score - a.score);

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            {/* Trophy / Result */}
            <Animated.View style={[styles.resultContainer, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.trophy}>{isDraw ? '🤝' : '🏆'}</Text>
                <Text style={styles.resultTitle}>
                    {isDraw ? 'تعادل!' : `${winner.name} فاز!`}
                </Text>
                <View style={styles.finalScore}>
                    <View style={styles.finalTeam}>
                        <Text style={styles.finalTeamName}>{match.team1.name}</Text>
                        <Text style={[styles.finalTeamScore, match.team1.score > match.team2.score && styles.winnerScore]}>
                            {match.team1.score}
                        </Text>
                    </View>
                    <Text style={styles.dash}>-</Text>
                    <View style={styles.finalTeam}>
                        <Text style={styles.finalTeamName}>{match.team2.name}</Text>
                        <Text style={[styles.finalTeamScore, match.team2.score > match.team1.score && styles.winnerScore]}>
                            {match.team2.score}
                        </Text>
                    </View>
                </View>
            </Animated.View>

            {/* Best Player */}
            {match.bestPlayer && (
                <Animated.View style={[styles.bestPlayerCard, { opacity: fadeAnim }]}>
                    <Text style={styles.bestPlayerLabel}>⭐ أحسن لاعب في المباراة</Text>
                    <Text style={styles.bestPlayerName}>{match.bestPlayer.name}</Text>
                    <Text style={styles.bestPlayerTeam}>
                        {match.bestPlayer.team} • {match.bestPlayer.score} نقطة
                    </Text>
                </Animated.View>
            )}

            {/* All Players Stats */}
            <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
                <Text style={styles.statsTitle}>إحصائيات اللاعبين</Text>
                {allPlayers.map((player: any, index: number) => (
                    <View key={index} style={styles.playerRow}>
                        <Text style={styles.playerStatScore}>{player.score}</Text>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerStatName}>
                                {index === 0 ? '👑 ' : ''}{player.name}
                            </Text>
                            <Text style={styles.playerTeamName}>{player.team}</Text>
                        </View>
                        <Text style={styles.playerRank}>#{index + 1}</Text>
                    </View>
                ))}
            </Animated.View>

            {/* Continue Button */}
            <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleFinishAndRecord}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[Colors.gold, Colors.goldDark]}
                    style={styles.continueBtnGradient}
                >
                    <Text style={styles.continueBtnText}>تسجيل النتيجة والعودة للدوري 🏆</Text>
                </LinearGradient>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
        paddingTop: Spacing.xxl + 20,
        alignItems: 'center',
    },
    resultContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    trophy: { fontSize: 80, marginBottom: Spacing.md },
    resultTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.gold,
        marginBottom: Spacing.lg,
    },
    finalScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xl,
    },
    finalTeam: { alignItems: 'center' },
    finalTeamName: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        marginBottom: Spacing.xs,
    },
    finalTeamScore: {
        fontSize: FontSizes.hero,
        fontWeight: 'bold',
        color: Colors.white,
    },
    winnerScore: {
        color: Colors.gold,
        textShadowColor: Colors.gold + '60',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    dash: {
        fontSize: FontSizes.xxl,
        color: Colors.textMuted,
    },
    bestPlayerCard: {
        width: '100%',
        backgroundColor: Colors.gold + '15',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gold + '40',
        marginBottom: Spacing.lg,
    },
    bestPlayerLabel: {
        fontSize: FontSizes.sm,
        color: Colors.goldLight,
        marginBottom: Spacing.xs,
    },
    bestPlayerName: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.gold,
    },
    bestPlayerTeam: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: 4,
    },
    statsCard: {
        width: '100%',
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        marginBottom: Spacing.lg,
        maxHeight: 250,
    },
    statsTitle: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.white,
        textAlign: 'right',
        marginBottom: Spacing.md,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    playerRank: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        color: Colors.gold,
        width: 30,
    },
    playerInfo: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: Spacing.sm,
    },
    playerStatName: {
        fontSize: FontSizes.md,
        color: Colors.white,
        fontWeight: '600',
    },
    playerTeamName: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
    },
    playerStatScore: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.emerald,
        width: 40,
        textAlign: 'center',
    },
    continueBtn: {
        width: '100%',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    continueBtnGradient: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    continueBtnText: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
});
