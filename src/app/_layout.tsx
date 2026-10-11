import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { DesignProvider } from '@/state/design-store';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.accent,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <DesignProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="create/runners" options={{ title: 'Runners' }} />
            <Stack.Screen name="create/designs" options={{ title: 'Choose a design' }} />
            <Stack.Screen name="create/editor" options={{ headerShown: false }} />
            <Stack.Screen name="create/format" options={{ title: 'Get it made' }} />
            <Stack.Screen name="admin/index" options={{ title: 'Production Console' }} />
          </Stack>
        </DesignProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
