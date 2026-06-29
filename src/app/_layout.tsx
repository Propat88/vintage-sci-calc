import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'DSEG7': require('../../assets/fonts/DSEG7Classic-Bold.ttf'),
    'SevenSegment': require('../../assets/fonts/Seven Segment.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      if (error) {
        console.error("Font loading error:", error);
      }
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
