import { create } from "zustand";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_URL = "https://chat-api-k4vi.onrender.com";
const WS_URL = Platform.select({
  ios: "wss://chat-api-k4vi.onrender.com",
  android: "ws://chat-api-k4vi.onrender.com",
  default: "ws://chat-api-k4vi.onrender.com",
});
const USER_STORAGE_KEY = "@chat_app_user";

interface Message {
  id: number;
  content: string;
  created_at: string;
  room_id: string;
  user_id: number;
  username: string;
  type?: "message" | "system"; // Add type for system messages
}

interface Room {
  id: string;
  name: string;
  created_at: string;
  expires_at: string;
}

interface User {
  id: number;
  username: string;
  created_at: string;
  expires_at: string;
}

interface ChatStore {
  user: User | null;
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  socket: WebSocket | null;

  // Actions
  setUsername: (username: string) => Promise<void>;
  getRooms: () => Promise<void>;
  createRoom: (name: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  user: null,
  rooms: [],
  currentRoom: null,
  messages: [],
  isLoading: false,
  error: null,
  socket: null,

  setUsername: async (username: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post(`${API_URL}/chat/username`, {
        username,
      });
      const userData = response.data;
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      set({ user: userData, isLoading: false });
    } catch (error) {
      set({ error: "Failed to set username", isLoading: false });
    }
  },

  getRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get(`${API_URL}/chat/rooms`);
      set({ rooms: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch rooms", isLoading: false });
    }
  },

  createRoom: async (name: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post(`${API_URL}/chat/rooms`, { name });
      const newRoom = response.data;
      set((state) => ({
        rooms: [...state.rooms, newRoom],
        isLoading: false,
      }));
      await get().joinRoom(newRoom.id);
    } catch (error) {
      set({ error: "Failed to create room", isLoading: false });
    }
  },

  joinRoom: async (roomId: string) => {
    const { user } = get();
    if (!user) {
      set({ error: "Please set username first" });
      return;
    }

    try {
      // Get room messages
      const messagesResponse = await axios.get(
        `${API_URL}/chat/rooms/${roomId}/messages`
      );

      // Create WebSocket connection
      const ws = new WebSocket(`${WS_URL}/ws/${roomId}/${user.username}`);

      // Add connection error handler
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ error: "Connection failed. Please try again.", socket: null });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === "message") {
          // Access the nested message object
          const messageData = data.message;

          // Ensure the received message matches our Message interface
          const message: Message = {
            id: messageData.id || Date.now(),
            content: messageData.content,
            created_at: messageData.created_at || new Date().toISOString(),
            room_id: get().currentRoom?.id || "",
            user_id: data.user_id || get().user?.id || 0,
            username:
              messageData.username ||
              messageData.sender ||
              get().user?.username ||
              "unknown",
            type: "message",
          };

          // Check if message already exists in the messages array
          set((state) => {
            const messageExists = state.messages.some(
              (existingMsg) =>
                existingMsg.content === message.content &&
                existingMsg.username === message.username &&
                existingMsg.created_at === message.created_at
            );

            if (!messageExists) {
              return {
                messages: [message, ...state.messages],
              };
            }
            return state;
          });
        } else if (data.event === "join" || data.event === "leave") {
          const systemMessage: Message = {
            id: Date.now(),
            content: `${data.username} has ${data.event}ed the room`,
            created_at: new Date().toISOString(),
            room_id: get().currentRoom?.id || "",
            user_id: 0,
            username: "System",
            type: "system",
          };

          set((state) => ({
            messages: [systemMessage, ...state.messages],
          }));
        }
      };

      // Send join event after connection is established
      ws.onopen = () => {
        console.log("WebSocket connected");
        set({ error: null }); // Clear any existing connection errors

        // Send join event
        ws.send(
          JSON.stringify({
            event: "join",
            username: user.username,
            room_id: roomId,
          })
        );
      };

      // Send leave event before closing
      ws.onclose = () => {
        console.log("WebSocket closed");
        if (get().currentRoom) {
          const systemMessage: Message = {
            id: Date.now(),
            content: `${user.username} has left the room`,
            created_at: new Date().toISOString(),
            room_id: get().currentRoom.id,
            user_id: 0,
            username: "System",
            type: "system",
          };
          set((state) => ({
            messages: [systemMessage, ...state.messages],
            socket: null,
          }));
        } else {
          set({ socket: null });
        }
      };

      const room = get().rooms.find((r) => r.id === roomId);
      set({
        currentRoom: room || null,
        messages: messagesResponse.data.reverse(), // Reverse to show newest messages at bottom
        socket: ws,
        error: null, // Clear any existing errors
      });
    } catch (error) {
      console.error("Join room error:", error);
      set({
        error: "Failed to join room. Please check your connection.",
        socket: null,
      });
    }
  },

  leaveRoom: () => {
    const { socket, currentRoom, user } = get();
    if (socket && currentRoom && user) {
      // Send leave event before closing
      try {
        socket.send(
          JSON.stringify({
            event: "leave",
            username: user.username,
            room_id: currentRoom.id,
          })
        );
      } catch (error) {
        console.error("Error sending leave event:", error);
      }
      socket.close();
    }
    set({
      currentRoom: null,
      messages: [],
      socket: null,
    });
  },

  sendMessage: (content: string) => {
    const { socket, currentRoom, user } = get();
    if (!socket || !currentRoom || !user) {
      set({ error: "Unable to send message. Please try rejoining the room." });
      return;
    }

    try {
      if (socket.readyState !== WebSocket.OPEN) {
        set({ error: "Connection lost. Reconnecting..." });
        // Try to reconnect
        get().joinRoom(currentRoom.id);
        return;
      }

      const message = {
        event: "message",
        content: content.trim(),
        username: user.username,
        room_id: currentRoom.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      socket.send(JSON.stringify(message));
    } catch (error) {
      set({ error: "Failed to send message. Please try again." });
    }
  },

  setError: (error: string | null) => set({ error }),
}));
