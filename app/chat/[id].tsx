import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useChatStore } from "../../store/chatStore";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = width * 0.75;

interface Message {
  id: number;
  content: string;
  created_at: string;
  room_id: string;
  user_id: number;
  username: string;
  type?: "message" | "system";
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [fadeAnim] = useState(new Animated.Value(0));

  const {
    messages,
    currentRoom,
    user,
    joinRoom,
    leaveRoom,
    sendMessage,
    error,
    socket,
  } = useChatStore();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (!user) {
      router.replace("/");
      return;
    }

    if (typeof id === "string") {
      joinRoom(id);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      leaveRoom();
    };
  }, [id, user]);

  useEffect(() => {
    if (error && error.includes("Connection lost") && reconnectAttempts < 3) {
      reconnectTimeoutRef.current = setTimeout(() => {
        if (typeof id === "string") {
          joinRoom(id);
          setReconnectAttempts((prev) => prev + 1);
        }
      }, 3000);
    }
  }, [error, reconnectAttempts]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      sendMessage(message.trim());
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    if (item.type === "system") {
      return (
        <Animated.View
          style={[
            styles.systemMessageContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.systemMessageText}>{item.content}</Text>
          <Text style={styles.systemMessageTime}>
            {formatTime(item.created_at)}
          </Text>
        </Animated.View>
      );
    }

    const isOwn = item.username === user?.username;
    const showUsername =
      index === messages.length - 1 ||
      messages[index - 1]?.username !== item.username;

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {!isOwn && showUsername && (
          <Text style={styles.username}>{item.username}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isOwn ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderConnectionStatus = () => {
    if (!socket) {
      return (
        <Animated.View
          style={[
            styles.connectionStatus,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.connectionStatusText}>Disconnected</Text>
          <TouchableOpacity
            style={styles.reconnectButton}
            onPress={() => {
              if (typeof id === "string") {
                setReconnectAttempts(0);
                joinRoom(id);
              }
            }}
          >
            <Text style={styles.reconnectButtonText}>Reconnect</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return null;
  };

  if (!currentRoom) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Joining room...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => router.back()}
            >
              <Text style={styles.backButton}>←</Text>
              <Text style={styles.backButtonText}>Rooms</Text>
            </TouchableOpacity>
            <View style={styles.roomInfoContainer}>
              <Text style={styles.roomName}>{currentRoom.name}</Text>
              <Text style={styles.participantCount}>
                {
                  messages.reduce((acc: string[], curr) => {
                    if (!acc.includes(curr.username)) acc.push(curr.username);
                    return acc;
                  }, []).length
                }{" "}
                participants
              </Text>
            </View>
          </Animated.View>

          {error && (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={() => useChatStore.getState().setError(null)}
              >
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {renderConnectionStatus()}

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            inverted={true}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToOffset({ offset: 0 })
            }
            onLayout={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
            showsVerticalScrollIndicator={false}
          />

          <Animated.View
            style={[
              styles.inputContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!!socket}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || !socket || isSending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim() || !socket || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  backButton: {
    fontSize: 24,
    color: "#007AFF",
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  roomInfoContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  participantCount: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  ownMessage: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  username: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    marginLeft: 2,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  ownMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 16,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff3cd",
    padding: 12,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffeeba",
  },
  connectionStatusText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "500",
  },
  reconnectButton: {
    backgroundColor: "#856404",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reconnectButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffebee",
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    flex: 1,
    color: "#d32f2f",
    fontSize: 14,
  },
  errorDismiss: {
    color: "#d32f2f",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 12,
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  systemMessageTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});
