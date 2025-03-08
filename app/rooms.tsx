import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useChatStore } from "../store/chatStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RoomsScreen() {
  const [newRoomName, setNewRoomName] = useState("");
  const { rooms, getRooms, createRoom, error, isLoading, user } =
    useChatStore();

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    getRooms();
  }, [user]);

  const handleCreateRoom = async () => {
    if (newRoomName.length < 3) {
      useChatStore
        .getState()
        .setError("Room name must be at least 3 characters long");
      return;
    }
    await createRoom(newRoomName);
    setNewRoomName("");
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("@chat_app_user");
    useChatStore.setState({
      user: null,
      rooms: [],
      currentRoom: null,
      messages: [],
    });
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Chat Rooms</Text>
            {user && <Text style={styles.username}>@{user.username}</Text>}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.createRoomContainer}>
          <TextInput
            style={styles.input}
            placeholder="New room name"
            placeholderTextColor="#999"
            value={newRoomName}
            onChangeText={setNewRoomName}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[
              styles.createButton,
              !newRoomName.trim() && styles.createButtonDisabled,
            ]}
            onPress={handleCreateRoom}
            disabled={!newRoomName.trim() || isLoading}
          >
            <Text
              style={[
                styles.buttonText,
                !newRoomName.trim() && styles.buttonTextDisabled,
              ]}
            >
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading rooms...</Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.roomsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.roomItem}
                onPress={() => handleJoinRoom(item.id)}
              >
                <Text style={styles.roomName}>{item.name}</Text>
                <Text style={styles.roomTime}>
                  Created {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rooms available</Text>
                <Text style={styles.emptySubtext}>
                  Create a new room to get started
                </Text>
              </View>
            }
          />
        )}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  username: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  createRoomContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  roomsList: {
    padding: 15,
  },
  roomItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roomName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  roomTime: {
    fontSize: 13,
    color: "#666",
  },
  error: {
    color: "#ff3b30",
    padding: 12,
    backgroundColor: "#ffebeb",
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});
