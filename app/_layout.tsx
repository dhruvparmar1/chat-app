import React, { useEffect } from "react";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    // Hide the splash screen once the app is ready
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Handle any errors that occur during splash screen hiding
        console.warn("Error hiding splash screen:", e);
      }
    };

    hideSplash();
  }, []);

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
