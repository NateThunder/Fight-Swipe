import "react-native-gesture-handler";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { FlowProvider } from "./FlowStore";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <FlowProvider>
          <Tabs
            screenOptions={{
              headerTitle: "Fight Swipe",
              tabBarActiveTintColor: "#f97316",
              tabBarInactiveTintColor: "#94a3b8",
            }}
          >
            <Tabs.Screen
              name="tabs/index"
              options={{
                title: "Fight Swipe",
                tabBarLabel: "Fight",
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="swipe-up" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="tabs/overview"
              options={{
                title: "Overview",
                tabBarLabel: "Overview",
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="account-tree" size={size} color={color} />
                ),
              }}
            />
            {/* Hide helper/redirect routes from the tab bar */}
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="BjjData" options={{ href: null }} />
            <Tabs.Screen name="MovesMenue" options={{ href: null }} />
            <Tabs.Screen name="TechniqueVideo" options={{ href: null }} />
            <Tabs.Screen name="GameLobby" options={{ href: null }} />
            <Tabs.Screen name="asyncStorage" options={{ href: null }} />
          </Tabs>
        </FlowProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
