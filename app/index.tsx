import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useChatStore } from "../store/chatStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UsernameScreen() {
  const [username, setUsername] = useState("");
  const { setUsername: setStoreUsername, error, isLoading } = useChatStore();

  useEffect(() => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Chat App</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Setting username..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});
