import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useChatStore } from "../store/chatStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const { height } = Dimensions.get("window");

export default function UsernameScreen() {
  const [username, setUsername] = useState("");
  const { setUsername: setStoreUsername, error, isLoading } = useChatStore();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("@chat_app_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          await setStoreUsername(userData.username);
          if (!useChatStore.getState().error) {
            router.push("/rooms");
          }
        }
      } catch (error) {
        console.error("Error checking stored user:", error);
      }
    };

    checkStoredUser();
  }, []);

  const handleSubmit = async () => {
    if (username.length < 3) {
      useChatStore
        .getState()
        .setError("Username must be at least 3 characters long");
      return;
    }

    await setStoreUsername(username);
    if (!useChatStore.getState().error) {
      router.push("/rooms");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.content,
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
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Chat App</Text>
          <Text style={styles.subtitle}>
            Connect and chat with friends in real-time
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Choose your username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., john_doe"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={20}
          />
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              (!username.trim() || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!username.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: 48,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    color: "#666",
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
