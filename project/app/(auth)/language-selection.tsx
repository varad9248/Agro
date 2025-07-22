import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { Language } from '@/constants/Translations';
import { Colors } from '@/constants/Colors';

export default function LanguageSelection() {
  const { setLanguage, t } = useLanguage();

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    await setLanguage(selectedLanguage);
    router.replace('/(auth)/login');
  };

  const languages = [
    { code: 'hi' as Language, name: 'हिंदी', subtitle: 'Hindi' },
    { code: 'mr' as Language, name: 'मराठी', subtitle: 'Marathi' },
    { code: 'en' as Language, name: 'English', subtitle: 'English' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🌾 Fasal Rakshak</Text>
          <Text style={styles.subtitle}>अपनी भाषा चुनें / Choose Your Language</Text>
        </View>

        <View style={styles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageButton}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageSubtitle}>{lang.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>फसल बीमा का नया तरीका / New Way of Crop Insurance</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary[50],
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  languageContainer: {
    gap: 16,
    marginBottom: 48,
  },
  languageButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary[700],
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  footer: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});