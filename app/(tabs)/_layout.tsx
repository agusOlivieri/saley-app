import { Tabs } from "expo-router";
import { Home, Heart, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#003366", // Color azul oscuro del logo/UI
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#eee",
          paddingTop: 8,
          height: 80, // Taller for better look
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Guardados",
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
