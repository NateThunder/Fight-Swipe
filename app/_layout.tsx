import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { FlowProvider, useFlow } from "./FlowStore";

function TabsLayout() {
  const { showLobby } = useFlow();

  const tabBarBaseStyle = {
    backgroundColor: "#0b0d12",
    borderTopWidth: 0,
    borderTopColor: "transparent",
    paddingVertical: 6,
    height: 64,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#94a3b8",
        sceneContainerStyle: {
          backgroundColor: "#0b0d12",
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: "#0b0d12" }} />,
        tabBarStyle: [
          tabBarBaseStyle,
          showLobby ? { display: "none" } : null,
          Platform.OS === "web"
            ? ({
                boxShadow: "none",
                borderTopWidth: 0,
                borderTopColor: "transparent",
              } as any)
            : {
                elevation: 0,
                shadowOpacity: 0,
                shadowColor: "transparent",
                shadowOffset: { height: 0, width: 0 },
                shadowRadius: 0,
              },
        ],
        tabBarItemStyle: {
          margin: 0,
          padding: 0,
        },
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
      <Tabs.Screen name="FlowStore" options={{ href: null }} />
      <Tabs.Screen name="gameSaves" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="components/HamburgerMenu" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
      <PaperProvider>
        <FlowProvider>
          <TabsLayout />
        </FlowProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
