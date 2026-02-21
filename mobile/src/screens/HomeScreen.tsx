import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const buttonAnims = [
        React.useRef(new Animated.Value(0)).current,
        React.useRef(new Animated.Value(0)).current,
        React.useRef(new Animated.Value(0)).current,
    ];

    React.useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.stagger(150, buttonAnims.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                })
            )),
        ]).start();
    }, []);

    const buttons = [
        {
            title: 'دوري جديد',
            subtitle: 'ابدأ مسابقة جديدة',
            icon: 'trophy' as const,
            color: Colors.gold,
            screen: 'TournamentSetup',
        },
        {
            title: 'استمرار الدوري',
            subtitle: 'كمّل مسابقة قائمة',
            icon: 'play-circle' as const,
            color: Colors.emerald,
            screen: 'TournamentList',
        },
        {
            title: 'بنك الأسئلة',
            subtitle: 'إدارة الأسئلة',
            icon: 'library' as const,
            color: Colors.goldLight,
            screen: 'QuestionBank',
        },
    ];

    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            {/* Decorative elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* Logo Area */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.logoGlow}>
                    <Text style={styles.logoIcon}>🌙</Text>
                </View>
                <Text style={styles.appName}>حِلّ و حَلّي</Text>
                <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                    مسابقات رمضان
                </Animated.Text>
            </Animated.View>

            {/* Menu Buttons */}
            <View style={styles.buttonContainer}>
                {buttons.map((btn, index) => (
                    <Animated.View
                        key={btn.screen}
                        style={{
                            opacity: buttonAnims[index],
                            transform: [{
                                translateY: buttonAnims[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            }],
                        }}
                    >
                        <TouchableOpacity
                            style={styles.menuButton}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(btn.screen)}
                        >
                            <LinearGradient
                                colors={['rgba(45, 27, 78, 0.9)', 'rgba(26, 5, 51, 0.95)']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: btn.color + '20' }]}>
                                    <Ionicons name={btn.icon} size={28} color={btn.color} />
                                </View>
                                <View style={styles.buttonTextContainer}>
                                    <Text style={styles.buttonTitle}>{btn.title}</Text>
                                    <Text style={styles.buttonSubtitle}>{btn.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            {/* Footer */}
            <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
                رمضان كريم 🌙
            </Animated.Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    decorCircle1: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.gold + '08',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -60,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: Colors.emerald + '06',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoGlow: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.gold + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.gold + '30',
    },
    logoIcon: {
        fontSize: 50,
    },
    appName: {
        fontSize: FontSizes.hero,
        fontWeight: 'bold',
        color: Colors.gold,
        textShadowColor: Colors.gold + '40',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        marginBottom: Spacing.xs,
    },
    tagline: {
        fontSize: FontSizes.lg,
        color: Colors.textMuted,
        letterSpacing: 2,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        gap: Spacing.md,
    },
    menuButton: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    buttonGradient: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonTextContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    buttonTitle: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 2,
    },
    buttonSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        fontSize: FontSizes.md,
        color: Colors.textMuted,
    },
});
