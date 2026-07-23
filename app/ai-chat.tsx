import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import api from '@/services/api';
import { lightColors as colors, FONT } from '@/constants/theme';
import { imgSrc } from '@/constants/config';

interface Message {
  role: 'bot' | 'user';
  reply: string;
  suggestions?: string[];
  hotels?: any[];
  attractions?: any[];
  plan?: any;
}

const WELCOME: Message = {
  role: 'bot',
  reply: "Salom! 👋 Men NavaiTour AI yordamchisiman.\nNarx, qulayliklar, tarixiy joylar, sayohat rejasi va boshqa savollarga javob beraman. Quyidagilarni so'rab ko'ring:",
  suggestions: ['Nima qila olasan?', 'Arzon mehmonxona', 'Bepul Wi-Fi bormi?', '3 kunlik plan yoz'],
};

const AttractionMini = ({ a, onPress }: { a: any, onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.miniCard}>
    {a.images?.[0] && (
      <Image
        source={{ uri: imgSrc(a.images[0]) }}
        style={styles.miniImg}
        contentFit="cover"
      />
    )}
    <View style={styles.miniInfo}>
      <Text style={styles.miniTitle} numberOfLines={1}>{a.name}</Text>
      <View style={styles.miniRow}>
        <Feather name="map-pin" size={12} color={colors.textMuted} />
        <Text style={styles.miniSub} numberOfLines={1}>{a.district}</Text>
      </View>
      {a.rating > 0 && (
        <View style={styles.miniRow}>
          <Feather name="star" size={12} color="#f59e0b" />
          <Text style={styles.miniRating}>{a.rating.toFixed(1)}</Text>
        </View>
      )}
    </View>
  </Pressable>
);

const HotelMini = ({ h, onPress }: { h: any, onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.miniCard}>
    {(h.image || h.images?.[0]) && (
      <Image
        source={{ uri: imgSrc(h.image || h.images?.[0]) }}
        style={styles.miniImg}
        contentFit="cover"
      />
    )}
    <View style={styles.miniInfo}>
      <Text style={styles.miniTitle} numberOfLines={1}>{h.name}</Text>
      <View style={styles.miniRow}>
        <Feather name="map-pin" size={12} color={colors.textMuted} />
        <Text style={styles.miniSub} numberOfLines={1}>{h.district || h.city}</Text>
      </View>
      {h.price > 0 && (
        <Text style={styles.miniPrice}>
          {Math.round(h.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm
        </Text>
      )}
    </View>
  </Pressable>
);

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    Keyboard.dismiss();
    const userMsg: Message = { role: 'user', reply: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant', { message: text.trim() });
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          reply: res.data.reply || "Kechirasiz, javob topa olmadim.",
          suggestions: res.data.suggestions,
          hotels: res.data.hotels,
          attractions: res.data.attractions,
          plan: res.data.plan,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', reply: "Xatolik yuz berdi. Iltimos, internetingizni tekshirib qayta urinib ko'ring." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.msgUserWrapper : styles.msgBotWrapper]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.botAvatarGradient}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </LinearGradient>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
              {item.reply}
            </Text>
          </View>

          {/* Cards for attractions */}
          {!isUser && item.attractions && item.attractions.length > 0 && (
            <View style={styles.cardsList}>
              {item.attractions.map((a: any) => (
                <AttractionMini
                  key={a._id}
                  a={a}
                  onPress={() => router.push(`/attraction/${a._id}`)}
                />
              ))}
            </View>
          )}

          {/* Cards for hotels */}
          {!isUser && item.hotels && item.hotels.length > 0 && (
            <View style={styles.cardsList}>
              {item.hotels.map((h: any) => (
                <HotelMini
                  key={h._id}
                  h={h}
                  onPress={() => router.push(`/hotel/${h._id}`)}
                />
              ))}
            </View>
          )}

          {/* Suggestions */}
          {!isUser && item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {item.suggestions.map((s, i) => (
                <Pressable key={i} onPress={() => send(s)} style={styles.suggestionBtn}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={24} color={colors.textMain} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AI Yordamchi</Text>
          <Text style={styles.headerSub}>Sayohat bo'yicha maslahatlar</Text>
        </View>
      </View>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Savolingizni yozing..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <Pressable onPress={() => send(input)} style={styles.sendBtn} disabled={loading || !input.trim()}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: colors.textMain,
  },
  headerSub: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: '#6366f1',
  },
  chatList: {
    padding: 16,
    gap: 20,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '92%',
  },
  msgUserWrapper: {
    alignSelf: 'flex-end',
  },
  msgBotWrapper: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  botAvatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleText: {
    fontFamily: FONT.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextBot: {
    color: colors.textMain,
  },
  cardsList: {
    marginTop: 8,
    gap: 8,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 8,
    gap: 12,
  },
  miniImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.bgHover,
  },
  miniInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  miniTitle: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: colors.textMain,
    marginBottom: 4,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  miniSub: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  miniRating: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#f59e0b',
  },
  miniPrice: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#10b981',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionBtn: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  suggestionText: {
    color: '#6366f1',
    fontFamily: FONT.semibold,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.bgMain,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingHorizontal: 20,
    fontFamily: FONT.medium,
    fontSize: 15,
    color: colors.textMain,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
