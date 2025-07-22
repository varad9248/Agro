import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslation, TranslationKey } from '@/constants/Translations';

const LANGUAGE_STORAGE_KEY = 'selected_language';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('hi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  return {
    language,
    setLanguage: saveLanguage,
    t,
    loading,
  };
}