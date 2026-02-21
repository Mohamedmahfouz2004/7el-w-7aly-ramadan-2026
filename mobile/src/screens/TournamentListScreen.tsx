import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

export default function TournamentListScreen({ navigation }: any) {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTournaments();
    }, []);

    const loadTournaments = async () => {
        try {
            const result = await api.getTournaments();
            setTournaments(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('حذف الدوري', `متأكد إنك عايز تحذف "${name}"؟`, [
            { text: 'لأ', style: 'cancel' },
            {
                text: 'آه، امسحه',
                style: 'destructive',
                onPress: async () => {
                    await api.deleteTournament(id);
                    loadTournaments();
                },
            },
        ]);
    };

    const phaseLabels: Record<string, string> = {
        league: 'دور المجموعات',
        quarter: 'ربع النهائي',
        semi: 'نصف النهائي',
        final: 'النهائي',
        completed: 'انتهى 🏆',
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TournamentDashboard', { tournamentId: item._id })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => handleDelete(item._id, item.name)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.incorrect + '80'} />
                </TouchableOpacity>
                <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{item.teams?.length || 0}</Text>
                    <Text style={styles.metaLabel}>فرق</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{item.questionsPerMatch}</Text>
                    <Text style={styles.metaLabel}>سؤال/مباراة</Text>
                </View>
                <View style={[styles.phaseBadge, item.status === 'completed' && styles.completedBadge]}>
                    <Text style={styles.phaseText}>{phaseLabels[item.currentPhase] || item.currentPhase}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-forward" size={24} color={Colors.gold} />
                </TouchableOpacity>
                <Text style={styles.title}>الدوريات 🏆</Text>
            </View>

            {tournaments.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏟️</Text>
                    <Text style={styles.emptyText}>مفيش دوريات لسه</Text>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => navigation.navigate('TournamentSetup')}
                    >
                        <Text style={styles.createBtnText}>أنشئ دوري جديد</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={tournaments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={loadTournaments}
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl + 10,
        marginBottom: Spacing.lg,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.cardBg,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.gold },
    list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.md },
    card: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cardTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.white,
    },
    cardMeta: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    metaItem: { alignItems: 'center' },
    metaValue: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.gold },
    metaLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
    phaseBadge: {
        backgroundColor: Colors.emerald + '20',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.round,
    },
    completedBadge: { backgroundColor: Colors.gold + '20' },
    phaseText: { fontSize: FontSizes.xs, color: Colors.emerald, fontWeight: '600' },
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    },
    emptyIcon: { fontSize: 80 },
    emptyText: { fontSize: FontSizes.xl, color: Colors.textMuted },
    createBtn: {
        backgroundColor: Colors.gold + '20', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gold,
    },
    createBtnText: { fontSize: FontSizes.md, color: Colors.gold, fontWeight: '600' },
});
