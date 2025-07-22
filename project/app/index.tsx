import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { loading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!authLoading && !languageLoading) {
      if (user) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/(auth)/language-selection');
      }
    }
  }, [user, authLoading, languageLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
  },
});