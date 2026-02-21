import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    FlatList,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';
import { api } from '../api';

const CATEGORIES = ['ديني', 'ثقافي', 'رياضي', 'علمي', 'تاريخي', 'عام'];
const DIFFICULTIES = ['سهل', 'متوسط', 'صعب'];

export default function QuestionBankScreen({ navigation }: any) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filterEpisode, setFilterEpisode] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // New question form
    const [newText, setNewText] = useState('');
    const [newOptions, setNewOptions] = useState(['', '', '', '']);
    const [newAnswer, setNewAnswer] = useState('');
    const [newCategory, setNewCategory] = useState('عام');
    const [newEpisode, setNewEpisode] = useState('1');
    const [newDifficulty, setNewDifficulty] = useState('متوسط');

    useEffect(() => {
        loadData();
    }, [filterEpisode, filterCategory]);

    const loadData = async () => {
        try {
            const params: Record<string, string> = {};
            if (filterEpisode) params.episode = filterEpisode;
            if (filterCategory) params.category = filterCategory;

            const [q, s] = await Promise.all([
                api.getQuestions(params),
                api.getQuestionStats(),
            ]);
            setQuestions(q);
            setStats(s);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async () => {
        if (!newText.trim()) {
            Alert.alert('تنبيه', 'اكتب نص السؤال');
            return;
        }
        if (!newAnswer.trim()) {
            Alert.alert('تنبيه', 'اكتب الإجابة');
            return;
        }

        try {
            await api.addQuestion({
                text: newText,
                options: newOptions.filter(o => o.trim()),
                answer: newAnswer,
                category: newCategory,
                episode: parseInt(newEpisode) || 1,
                difficulty: newDifficulty,
            });

            setShowAddModal(false);
            setNewText('');
            setNewOptions(['', '', '', '']);
            setNewAnswer('');
            loadData();
            Alert.alert('✅', 'تم إضافة السؤال');
        } catch (err: any) {
            Alert.alert('خطأ', err.message);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('حذف', 'متأكد إنك عايز تحذف السؤال ده؟', [
            { text: 'لأ', style: 'cancel' },
            {
                text: 'آه',
                style: 'destructive',
                onPress: async () => {
                    await api.deleteQuestion(id);
                    loadData();
                },
            },
        ]);
    };

    const handleResetAll = () => {
        Alert.alert('إعادة تعيين', 'كده كل الأسئلة هترجع "مش مستخدمة" - متأكد؟', [
            { text: 'لأ', style: 'cancel' },
            {
                text: 'آه',
                onPress: async () => {
                    await api.resetQuestions(filterEpisode ? parseInt(filterEpisode) : undefined);
                    loadData();
                },
            },
        ]);
    };

    const renderQuestion = ({ item }: any) => (
        <View style={[styles.questionCard, item.used && styles.usedCard]}>
            <View style={styles.questionHeader}>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.incorrect + '80'} />
                </TouchableOpacity>
                <View style={styles.badges}>
                    <Text style={styles.badge}>{item.category}</Text>
                    <Text style={[styles.badge, styles.epBadge]}>حلقة {item.episode}</Text>
                    {item.used && <Text style={[styles.badge, styles.usedBadge]}>مستخدم</Text>}
                </View>
            </View>
            <Text style={styles.questionText}>{item.text}</Text>
            {item.options?.length > 0 && (
                <View style={styles.optionsPreview}>
                    {item.options.map((opt: string, i: number) => (
                        <Text key={i} style={[styles.optionPreview, opt === item.answer && styles.correctOption]}>
                            {opt}
                        </Text>
                    ))}
                </View>
            )}
            <Text style={styles.answerPreview}>الإجابة: {item.answer}</Text>
        </View>
    );

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-forward" size={24} color={Colors.gold} />
                </TouchableOpacity>
                <Text style={styles.title}>بنك الأسئلة 📚</Text>
            </View>

            {/* Stats */}
            {stats && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>الكل</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.correct }]}>{stats.unused}</Text>
                        <Text style={styles.statLabel}>متاح</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.textMuted }]}>{stats.used}</Text>
                        <Text style={styles.statLabel}>مستخدم</Text>
                    </View>
                </View>
            )}

            {/* Filters */}
            <View style={styles.filters}>
                <TextInput
                    style={styles.filterInput}
                    placeholder="الحلقة"
                    placeholderTextColor={Colors.textMuted}
                    value={filterEpisode}
                    onChangeText={setFilterEpisode}
                    keyboardType="number-pad"
                    textAlign="center"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
                    <TouchableOpacity
                        style={[styles.filterChip, !filterCategory && styles.activeChip]}
                        onPress={() => setFilterCategory('')}
                    >
                        <Text style={[styles.chipText, !filterCategory && styles.activeChipText]}>الكل</Text>
                    </TouchableOpacity>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.filterChip, filterCategory === cat && styles.activeChip]}
                            onPress={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                        >
                            <Text style={[styles.chipText, filterCategory === cat && styles.activeChipText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add-circle" size={20} color={Colors.gold} />
                    <Text style={styles.addBtnText}>إضافة سؤال</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={handleResetAll}>
                    <Ionicons name="refresh" size={18} color={Colors.emerald} />
                    <Text style={styles.resetBtnText}>إعادة تعيين</Text>
                </TouchableOpacity>
            </View>

            {/* Questions List */}
            <FlatList
                data={questions}
                keyExtractor={(item) => item._id}
                renderItem={renderQuestion}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={loadData}
            />

            {/* Add Question Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close-circle" size={28} color={Colors.incorrect} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>إضافة سؤال جديد ✍️</Text>
                            </View>

                            <Text style={styles.modalLabel}>نص السؤال</Text>
                            <TextInput
                                style={[styles.modalInput, styles.multilineInput]}
                                placeholder="اكتب السؤال هنا..."
                                placeholderTextColor={Colors.textMuted}
                                value={newText}
                                onChangeText={setNewText}
                                multiline
                                textAlign="right"
                            />

                            <Text style={styles.modalLabel}>الاختيارات</Text>
                            {newOptions.map((opt, i) => (
                                <TextInput
                                    key={i}
                                    style={styles.modalInput}
                                    placeholder={`اختيار ${i + 1}`}
                                    placeholderTextColor={Colors.textMuted}
                                    value={opt}
                                    onChangeText={(text) => {
                                        const updated = [...newOptions];
                                        updated[i] = text;
                                        setNewOptions(updated);
                                    }}
                                    textAlign="right"
                                />
                            ))}

                            <Text style={styles.modalLabel}>الإجابة الصحيحة</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="الإجابة..."
                                placeholderTextColor={Colors.textMuted}
                                value={newAnswer}
                                onChangeText={setNewAnswer}
                                textAlign="right"
                            />

                            <View style={styles.formRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalLabel}>رقم الحلقة</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={newEpisode}
                                        onChangeText={setNewEpisode}
                                        keyboardType="number-pad"
                                        textAlign="center"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalLabel}>الصعوبة</Text>
                                    <View style={styles.chipRow}>
                                        {DIFFICULTIES.map(d => (
                                            <TouchableOpacity
                                                key={d}
                                                style={[styles.diffChip, newDifficulty === d && styles.activeDiffChip]}
                                                onPress={() => setNewDifficulty(d)}
                                            >
                                                <Text style={[styles.diffChipText, newDifficulty === d && styles.activeDiffChipText]}>{d}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.modalLabel}>التصنيف</Text>
                            <View style={styles.chipRow}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catChip, newCategory === cat && styles.activeCatChip]}
                                        onPress={() => setNewCategory(cat)}
                                    >
                                        <Text style={[styles.catChipText, newCategory === cat && styles.activeCatChipText]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddQuestion}>
                                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.submitGradient}>
                                    <Text style={styles.submitText}>✅ إضافة السؤال</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl + 10, marginBottom: Spacing.md,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.gold },
    statsRow: {
        flexDirection: 'row-reverse', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md,
    },
    statItem: {
        flex: 1, backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md,
        padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
    },
    statValue: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.gold },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
    filters: {
        paddingHorizontal: Spacing.lg, flexDirection: 'row-reverse', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'center',
    },
    filterInput: {
        width: 60, backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md,
        padding: Spacing.sm, color: Colors.white, fontSize: FontSizes.sm,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    filterChip: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.round, backgroundColor: Colors.cardBg,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    activeChip: { backgroundColor: Colors.gold + '20', borderColor: Colors.gold },
    chipText: { fontSize: FontSizes.xs, color: Colors.textMuted },
    activeChipText: { color: Colors.gold },
    actions: {
        flexDirection: 'row-reverse', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md,
    },
    addBtn: {
        flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
        gap: Spacing.xs, backgroundColor: Colors.gold + '15', padding: Spacing.sm,
        borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.gold + '40',
    },
    addBtnText: { fontSize: FontSizes.sm, color: Colors.gold, fontWeight: '600' },
    resetBtn: {
        flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs,
        backgroundColor: Colors.emerald + '15', padding: Spacing.sm, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.emerald + '40',
    },
    resetBtnText: { fontSize: FontSizes.sm, color: Colors.emerald, fontWeight: '600' },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    questionCard: {
        backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    usedCard: { opacity: 0.5 },
    questionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm,
    },
    badges: { flexDirection: 'row-reverse', gap: Spacing.xs },
    badge: {
        fontSize: FontSizes.xs, color: Colors.gold, backgroundColor: Colors.gold + '15',
        paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.round,
    },
    epBadge: { backgroundColor: Colors.emerald + '15', color: Colors.emerald },
    usedBadge: { backgroundColor: Colors.incorrect + '15', color: Colors.incorrect },
    questionText: {
        fontSize: FontSizes.md, color: Colors.white, textAlign: 'right', lineHeight: 24, marginBottom: Spacing.sm,
    },
    optionsPreview: {
        flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs,
    },
    optionPreview: {
        fontSize: FontSizes.xs, color: Colors.textMuted, backgroundColor: Colors.primaryDark,
        paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm,
    },
    correctOption: { color: Colors.correct, borderWidth: 1, borderColor: Colors.correct + '40' },
    answerPreview: { fontSize: FontSizes.xs, color: Colors.correct, textAlign: 'right' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.primaryLight, borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg,
    },
    modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.gold },
    modalLabel: {
        fontSize: FontSizes.sm, color: Colors.textLight, textAlign: 'right', marginBottom: Spacing.xs,
        fontWeight: '600', marginTop: Spacing.sm,
    },
    modalInput: {
        backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.md,
        padding: Spacing.md, color: Colors.white, fontSize: FontSizes.md,
        borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.xs,
    },
    multilineInput: { minHeight: 80, textAlignVertical: 'top' },
    formRow: { flexDirection: 'row-reverse', gap: Spacing.md },
    chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs },
    diffChip: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round,
        backgroundColor: Colors.primaryDark, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    activeDiffChip: { backgroundColor: Colors.gold + '20', borderColor: Colors.gold },
    diffChipText: { fontSize: FontSizes.xs, color: Colors.textMuted },
    activeDiffChipText: { color: Colors.gold },
    catChip: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round,
        backgroundColor: Colors.primaryDark, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    activeCatChip: { backgroundColor: Colors.emerald + '20', borderColor: Colors.emerald },
    catChipText: { fontSize: FontSizes.xs, color: Colors.textMuted },
    activeCatChipText: { color: Colors.emerald },
    submitBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.lg, marginBottom: Spacing.xl },
    submitGradient: { padding: Spacing.lg, alignItems: 'center' },
    submitText: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primaryDark },
});
