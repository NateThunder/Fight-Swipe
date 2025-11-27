import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function RootLayout() {
  return (
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
    </Tabs>
  );
}
