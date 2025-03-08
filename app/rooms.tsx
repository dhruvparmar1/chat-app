import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useChatStore } from "../store/chatStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

interface Room {
  id: string;
  name: string;
  created_at: string;
}

export default function RoomsScreen() {
  const [newRoomName, setNewRoomName] = useState("");
  const { rooms, getRooms, createRoom, error, isLoading, user } =
    useChatStore();
  const [fadeAnim] = useState(new Animated.Value(0));

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

  const renderRoomItem = ({ item, index }: { item: Room; index: number }) => (
    <Animated.View
      style={[
        styles.roomItemContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => handleJoinRoom(item.id)}
      >
        <View style={styles.roomItemContent}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomTime}>
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.joinButton}>Join →</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Chat Rooms</Text>
              {user && <Text style={styles.username}>@{user.username}</Text>}
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.createRoomContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter room name"
              placeholderTextColor="#999"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoCapitalize="none"
              maxLength={30}
            />
            <TouchableOpacity
              style={[
                styles.createButton,
                (!newRoomName.trim() || isLoading) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreateRoom}
              disabled={!newRoomName.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isLoading && !rooms.length ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading rooms...</Text>
            </View>
          ) : (
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.roomsList}
              renderItem={renderRoomItem}
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
        </Animated.View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
  },
  username: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  createRoomContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: "#333",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
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
  roomsList: {
    padding: 16,
  },
  roomItemContainer: {
    marginBottom: 12,
  },
  roomItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomItemContent: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  roomTime: {
    fontSize: 13,
    color: "#666",
  },
  joinButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
});
