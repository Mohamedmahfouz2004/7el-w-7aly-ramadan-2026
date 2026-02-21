import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

const { width } = Dimensions.get('window');

export default function GameScreen({ route, navigation }: any) {
    const { matchId } = route.params;
    const [match, setMatch] = useState<any>(null);
    const [question, setQuestion] = useState<any>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Animations
    const questionAnim = useRef(new Animated.Value(0)).current;
    const scoreFlash1 = useRef(new Animated.Value(1)).current;
    const scoreFlash2 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startMatch();
    }, []);

    const animateQuestion = () => {
        questionAnim.setValue(0);
        Animated.spring(questionAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const flashScore = (team: 'team1' | 'team2', correct: boolean) => {
        const anim = team === 'team1' ? scoreFlash1 : scoreFlash2;
        Animated.sequence([
            Animated.timing(anim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const startMatch = async () => {
        try {
            const result = await api.startMatch(matchId);
            setMatch(result.match);
            setQuestion(result.question);
            animateQuestion();
        } catch (err: any) {
            Alert.alert('خطأ', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (teamSide: 'team1' | 'team2', playerIndex: number, correct: boolean) => {
        if (actionLoading) return;
        setActionLoading(true);
        setShowOptions(false);
        setShowAnswer(false);

        try {
            const result = await api.answerQuestion(matchId, { teamSide, playerIndex, correct });

            flashScore(teamSide, correct);
            setMatch(result.match);

            if (result.finished) {
                navigation.replace('MatchResults', {
                    matchId,
                    tournamentId: match.tournament,
                });
                return;
            }

            setQuestion(result.question);
            animateQuestion();
        } catch (err: any) {
            Alert.alert('خطأ', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSkip = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        setShowOptions(false);
        setShowAnswer(false);

        try {
            const result = await api.skipQuestion(matchId);
            setMatch(result.match);
            setQuestion(result.question);
            animateQuestion();
        } catch (err: any) {
            Alert.alert('خطأ', err.message || 'مفيش أسئلة تانية');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceFinish = () => {
        Alert.alert('إنهاء المباراة', 'متأكد إنك عايز تنهي المباراة دلوقتي؟', [
            { text: 'لأ', style: 'cancel' },
            {
                text: 'آه، انهيها',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.finishMatch(matchId);
                        navigation.replace('MatchResults', {
                            matchId,
                            tournamentId: match.tournament,
                        });
                    } catch (err: any) {
                        Alert.alert('خطأ', err.message);
                    }
                },
            },
        ]);
    };

    if (loading || !match) {
        return (
            <LinearGradient colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.loadingText}>جاري التحميل... 🌙</Text>
            </LinearGradient>
        );
    }

    const progress = match.questionsAsked / match.totalQuestions;

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Top Bar - Scores & Progress */}
                <View style={styles.topBar}>
                    {/* Team 1 Score */}
                    <Animated.View style={[styles.scoreCard, { transform: [{ scale: scoreFlash1 }] }]}>
                        <Text style={styles.teamName}>{match.team1.name}</Text>
                        <Text style={[styles.score, match.team1.score > match.team2.score && styles.leadingScore]}>
                            {match.team1.score}
                        </Text>
                    </Animated.View>

                    {/* VS & Progress */}
                    <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                        <Text style={styles.progressText}>
                            {match.questionsAsked}/{match.totalQuestions}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>

                    {/* Team 2 Score */}
                    <Animated.View style={[styles.scoreCard, { transform: [{ scale: scoreFlash2 }] }]}>
                        <Text style={styles.teamName}>{match.team2.name}</Text>
                        <Text style={[styles.score, match.team2.score > match.team1.score && styles.leadingScore]}>
                            {match.team2.score}
                        </Text>
                    </Animated.View>
                </View>

                {/* Question Card */}
                {question && (
                    <Animated.View style={[
                        styles.questionCard,
                        {
                            opacity: questionAnim,
                            transform: [{
                                translateY: questionAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0],
                                }),
                            }],
                        },
                    ]}>
                        <View style={styles.questionBadge}>
                            <Text style={styles.questionBadgeText}>
                                {question.category} • {question.difficulty}
                            </Text>
                        </View>
                        <Text style={styles.questionText}>{question.text}</Text>

                        {/* Show Options Button / Options */}
                        {!showOptions ? (
                            <TouchableOpacity
                                style={styles.revealBtn}
                                onPress={() => setShowOptions(true)}
                            >
                                <Ionicons name="list" size={20} color={Colors.gold} />
                                <Text style={styles.revealBtnText}>عرض الاختيارات</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.optionsContainer}>
                                {question.options?.map((opt: string, i: number) => (
                                    <View key={i} style={styles.optionItem}>
                                        <Text style={styles.optionText}>{opt}</Text>
                                        <View style={styles.optionBullet}>
                                            <Text style={styles.optionLetter}>
                                                {String.fromCharCode(1633 + i)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Show Answer Button / Answer */}
                        {!showAnswer ? (
                            <TouchableOpacity
                                style={[styles.revealBtn, styles.answerRevealBtn]}
                                onPress={() => setShowAnswer(true)}
                            >
                                <Ionicons name="eye" size={20} color={Colors.emerald} />
                                <Text style={[styles.revealBtnText, { color: Colors.emerald }]}>عرض الإجابة</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.answerContainer}>
                                <Ionicons name="checkmark-circle" size={24} color={Colors.correct} />
                                <Text style={styles.answerText}>{question.answer}</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Team 1 Players */}
                <View style={styles.teamSection}>
                    <Text style={styles.teamSectionTitle}>{match.team1.name}</Text>
                    <View style={styles.playersGrid}>
                        {match.team1.players.map((player: any, index: number) => (
                            <View key={index} style={styles.playerCard}>
                                <Text style={styles.playerName}>{player.name}</Text>
                                <Text style={styles.playerScore}>⭐ {player.score}</Text>
                                <View style={styles.playerActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.correctBtn]}
                                        onPress={() => handleAnswer('team1', index, true)}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="checkmark" size={22} color="#fff" />
                                        <Text style={styles.actionText}>صح</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.wrongBtn]}
                                        onPress={() => handleAnswer('team1', index, false)}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="close" size={22} color="#fff" />
                                        <Text style={styles.actionText}>غلط</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Team 2 Players */}
                <View style={styles.teamSection}>
                    <Text style={styles.teamSectionTitle}>{match.team2.name}</Text>
                    <View style={styles.playersGrid}>
                        {match.team2.players.map((player: any, index: number) => (
                            <View key={index} style={styles.playerCard}>
                                <Text style={styles.playerName}>{player.name}</Text>
                                <Text style={styles.playerScore}>⭐ {player.score}</Text>
                                <View style={styles.playerActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.correctBtn]}
                                        onPress={() => handleAnswer('team2', index, true)}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="checkmark" size={22} color="#fff" />
                                        <Text style={styles.actionText}>صح</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.wrongBtn]}
                                        onPress={() => handleAnswer('team2', index, false)}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="close" size={22} color="#fff" />
                                        <Text style={styles.actionText}>غلط</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleSkip}
                        disabled={actionLoading}
                    >
                        <Ionicons name="play-skip-forward" size={20} color={Colors.skip} />
                        <Text style={styles.skipBtnText}>تخطي السؤال ⏭️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.finishBtn}
                        onPress={handleForceFinish}
                    >
                        <Ionicons name="stop-circle" size={20} color={Colors.incorrect} />
                        <Text style={styles.finishBtnText}>إنهاء المباراة</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingTop: Spacing.xxl, paddingBottom: 40 },
    loadingText: { color: Colors.gold, fontSize: FontSizes.xl },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    scoreCard: {
        flex: 1,
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    teamName: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    score: {
        fontSize: FontSizes.title,
        fontWeight: 'bold',
        color: Colors.white,
    },
    leadingScore: {
        color: Colors.gold,
        textShadowColor: Colors.gold + '60',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    vsContainer: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    vsText: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.gold,
        marginBottom: Spacing.xs,
    },
    progressText: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    progressBar: {
        width: 60,
        height: 4,
        backgroundColor: Colors.primaryDark,
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.gold,
        borderRadius: 2,
    },
    questionCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.gold + '40',
    },
    questionBadge: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.gold + '20',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.round,
        marginBottom: Spacing.md,
    },
    questionBadgeText: {
        fontSize: FontSizes.xs,
        color: Colors.gold,
        fontWeight: '600',
    },
    questionText: {
        fontSize: FontSizes.xl,
        color: Colors.white,
        textAlign: 'center',
        lineHeight: 36,
        fontWeight: 'bold',
        marginBottom: Spacing.lg,
    },
    revealBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.gold + '40',
        borderStyle: 'dashed',
        marginBottom: Spacing.sm,
    },
    answerRevealBtn: {
        borderColor: Colors.emerald + '40',
    },
    revealBtnText: {
        fontSize: FontSizes.md,
        color: Colors.gold,
        fontWeight: '600',
    },
    optionsContainer: {
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    optionItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primaryDark + 'cc',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    optionBullet: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.gold + '30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLetter: {
        fontSize: FontSizes.sm,
        color: Colors.gold,
        fontWeight: 'bold',
    },
    optionText: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.textLight,
        textAlign: 'right',
    },
    answerContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.correct + '20',
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    answerText: {
        fontSize: FontSizes.xl,
        color: Colors.correct,
        fontWeight: 'bold',
    },
    teamSection: {
        marginBottom: Spacing.lg,
    },
    teamSectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.gold,
        textAlign: 'right',
        marginBottom: Spacing.sm,
    },
    playersGrid: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    playerCard: {
        flex: 1,
        minWidth: 140,
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    playerName: {
        fontSize: FontSizes.md,
        color: Colors.white,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    playerScore: {
        fontSize: FontSizes.sm,
        color: Colors.goldLight,
        marginBottom: Spacing.sm,
    },
    playerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    correctBtn: {
        backgroundColor: Colors.correct,
    },
    wrongBtn: {
        backgroundColor: Colors.incorrect,
    },
    actionText: {
        color: '#fff',
        fontSize: FontSizes.sm,
        fontWeight: 'bold',
    },
    bottomActions: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    skipBtn: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.skip + '20',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.skip + '40',
    },
    skipBtnText: {
        fontSize: FontSizes.md,
        color: Colors.skip,
        fontWeight: '600',
    },
    finishBtn: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.incorrect + '15',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.incorrect + '30',
    },
    finishBtnText: {
        fontSize: FontSizes.md,
        color: Colors.incorrect,
        fontWeight: '600',
    },
});
