import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

interface Team {
    name: string;
    playerCount: number;
    players: string[];
}

export default function TournamentSetupScreen({ navigation }: any) {
    const [tournamentName, setTournamentName] = useState('');
    const [questionsPerMatch, setQuestionsPerMatch] = useState('20');
    const [teams, setTeams] = useState<Team[]>([
        { name: '', playerCount: 2, players: ['', ''] },
        { name: '', playerCount: 2, players: ['', ''] },
    ]);
    const [loading, setLoading] = useState(false);

    const addTeam = () => {
        setTeams([...teams, { name: '', playerCount: 2, players: ['', ''] }]);
    };

    const removeTeam = (index: number) => {
        if (teams.length <= 2) {
            Alert.alert('تنبيه', 'لازم يكون فيه فريقين على الأقل');
            return;
        }
        setTeams(teams.filter((_, i) => i !== index));
    };

    const updateTeamName = (index: number, name: string) => {
        const updated = [...teams];
        updated[index].name = name;
        setTeams(updated);
    };

    const updatePlayerCount = (teamIndex: number, count: number) => {
        if (count < 1 || count > 10) return;
        const updated = [...teams];
        updated[teamIndex].playerCount = count;
        while (updated[teamIndex].players.length < count) {
            updated[teamIndex].players.push('');
        }
        while (updated[teamIndex].players.length > count) {
            updated[teamIndex].players.pop();
        }
        setTeams(updated);
    };

    const updatePlayerName = (teamIndex: number, playerIndex: number, name: string) => {
        const updated = [...teams];
        updated[teamIndex].players[playerIndex] = name;
        setTeams(updated);
    };

    const handleCreate = async () => {
        if (!tournamentName.trim()) {
            Alert.alert('تنبيه', 'اكتب اسم الدوري');
            return;
        }

        for (let i = 0; i < teams.length; i++) {
            if (!teams[i].name.trim()) {
                Alert.alert('تنبيه', `اكتب اسم الفريق ${i + 1}`);
                return;
            }
            for (let j = 0; j < teams[i].players.length; j++) {
                if (!teams[i].players[j].trim()) {
                    Alert.alert('تنبيه', `اكتب اسم اللاعب ${j + 1} في فريق "${teams[i].name}"`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const result = await api.createTournament({
                name: tournamentName,
                teams: teams.map(t => ({
                    name: t.name,
                    players: t.players.map(p => ({ name: p })),
                })),
                questionsPerMatch: parseInt(questionsPerMatch) || 20,
            });

            Alert.alert('🎉 تم!', `الدوري "${tournamentName}" اتعمل بنجاح`, [
                { text: 'يلا نبدأ', onPress: () => navigation.replace('TournamentDashboard', { tournamentId: result._id }) },
            ]);
        } catch (err: any) {
            Alert.alert('خطأ', err.message || 'حصل مشكلة في إنشاء الدوري');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-forward" size={24} color={Colors.gold} />
                        </TouchableOpacity>
                        <Text style={styles.title}>دوري جديد 🏆</Text>
                    </View>

                    {/* Tournament Name */}
                    <View style={styles.card}>
                        <Text style={styles.label}>اسم الدوري</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="مثال: دوري رمضان 2026"
                            placeholderTextColor={Colors.textMuted}
                            value={tournamentName}
                            onChangeText={setTournamentName}
                            textAlign="right"
                        />
                    </View>

                    {/* Questions Per Match */}
                    <View style={styles.card}>
                        <Text style={styles.label}>عدد الأسئلة في كل مباراة</Text>
                        <View style={styles.counterRow}>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => setQuestionsPerMatch(String(Math.max(5, parseInt(questionsPerMatch) - 5)))}
                            >
                                <Ionicons name="remove" size={20} color={Colors.gold} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, styles.counterInput]}
                                value={questionsPerMatch}
                                onChangeText={setQuestionsPerMatch}
                                keyboardType="number-pad"
                                textAlign="center"
                            />
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => setQuestionsPerMatch(String(parseInt(questionsPerMatch) + 5))}
                            >
                                <Ionicons name="add" size={20} color={Colors.gold} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Teams */}
                    <Text style={styles.sectionTitle}>الفرق ({teams.length})</Text>

                    {teams.map((team, teamIndex) => (
                        <View key={teamIndex} style={styles.teamCard}>
                            <View style={styles.teamHeader}>
                                <TouchableOpacity onPress={() => removeTeam(teamIndex)}>
                                    <Ionicons name="close-circle" size={24} color={Colors.incorrect} />
                                </TouchableOpacity>
                                <Text style={styles.teamNumber}>فريق {teamIndex + 1}</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="اسم الفريق"
                                placeholderTextColor={Colors.textMuted}
                                value={team.name}
                                onChangeText={(text) => updateTeamName(teamIndex, text)}
                                textAlign="right"
                            />

                            <View style={styles.playerCountRow}>
                                <View style={styles.counterRow}>
                                    <TouchableOpacity
                                        style={styles.counterBtnSm}
                                        onPress={() => updatePlayerCount(teamIndex, team.playerCount - 1)}
                                    >
                                        <Ionicons name="remove" size={16} color={Colors.gold} />
                                    </TouchableOpacity>
                                    <Text style={styles.playerCountText}>{team.playerCount}</Text>
                                    <TouchableOpacity
                                        style={styles.counterBtnSm}
                                        onPress={() => updatePlayerCount(teamIndex, team.playerCount + 1)}
                                    >
                                        <Ionicons name="add" size={16} color={Colors.gold} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.playerCountLabel}>عدد اللاعبين</Text>
                            </View>

                            {team.players.map((player, playerIndex) => (
                                <TextInput
                                    key={playerIndex}
                                    style={[styles.input, styles.playerInput]}
                                    placeholder={`اسم اللاعب ${playerIndex + 1}`}
                                    placeholderTextColor={Colors.textMuted}
                                    value={player}
                                    onChangeText={(text) => updatePlayerName(teamIndex, playerIndex, text)}
                                    textAlign="right"
                                />
                            ))}
                        </View>
                    ))}

                    {/* Add Team Button */}
                    <TouchableOpacity style={styles.addTeamBtn} onPress={addTeam}>
                        <Ionicons name="add-circle" size={24} color={Colors.emerald} />
                        <Text style={styles.addTeamText}>إضافة فريق</Text>
                    </TouchableOpacity>

                    {/* Create Button */}
                    <TouchableOpacity
                        style={[styles.createBtn, loading && styles.disabledBtn]}
                        onPress={handleCreate}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colors.gold, Colors.goldDark]}
                            style={styles.createBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.createBtnText}>
                                {loading ? 'جاري الإنشاء...' : '🚀 ابدأ الدوري'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
        marginTop: Spacing.xxl,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.gold,
    },
    card: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    label: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        marginBottom: Spacing.sm,
        textAlign: 'right',
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.primaryDark,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.white,
        fontSize: FontSizes.md,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    counterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gold + '20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.gold + '40',
    },
    counterInput: {
        width: 80,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.white,
        textAlign: 'right',
        marginBottom: Spacing.md,
        marginTop: Spacing.md,
    },
    teamCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        gap: Spacing.sm,
    },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    teamNumber: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.gold,
    },
    playerCountRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    playerCountLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    counterBtnSm: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.gold + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerCountText: {
        fontSize: FontSizes.lg,
        color: Colors.white,
        fontWeight: 'bold',
        marginHorizontal: Spacing.md,
    },
    playerInput: {
        backgroundColor: Colors.primaryDark + 'cc',
        borderColor: Colors.cardBorder,
    },
    addTeamBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.emerald + '40',
        borderStyle: 'dashed',
        marginBottom: Spacing.lg,
    },
    addTeamText: {
        fontSize: FontSizes.md,
        color: Colors.emerald,
        fontWeight: '600',
    },
    createBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.xxl,
    },
    disabledBtn: { opacity: 0.6 },
    createBtnGradient: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    createBtnText: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.primaryDark,
    },
});
