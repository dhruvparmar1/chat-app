import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Welcome",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="rooms"
          options={{
            title: "Chat Rooms",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            title: "Chat",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
