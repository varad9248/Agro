import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Language } from '@/constants/Translations';
import { 
  User, 
  Globe, 
  LogOut, 
  Coins, 
  Shield, 
  FileText,
  Settings,
  Info,
  X
} from 'lucide-react-native';

interface Profile {
  full_name: string;
  email: string;
  preferred_language: Language;
  coins_earned: number;
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const showInstructions = () => {
    Alert.alert(
      t('profile'),
      t('profileInstructions'),
      [{ text: t('understand'), style: 'default' }]
    );
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.warn('Profile data unavailable:', error);
        // Set fallback profile data
        setProfile({
          full_name: user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          preferred_language: 'hi',
          coins_earned: 0,
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.warn('Profile connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      await setLanguage(newLanguage);
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: newLanguage })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating language:', error);
      } else {
        setProfile(prev => prev ? { ...prev, preferred_language: newLanguage } : null);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('logout'),
      'Are you sure you want to logout?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert(t('error'), error.message);
            } else {
              router.replace('/(auth)/language-selection');
            }
          },
        },
      ]
    );
  };

  const languages = [
    { code: 'hi' as Language, name: 'हिंदी', subtitle: 'Hindi' },
    { code: 'mr' as Language, name: 'मराठी', subtitle: 'Marathi' },
    { code: 'en' as Language, name: 'English', subtitle: 'English' },
  ];

  const renderModal = (visible: boolean, onClose: () => void, title: string, content: string) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalText}>{content}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('profile')}</Text>
            <TouchableOpacity onPress={showInstructions} style={styles.infoButton}>
              <Info size={20} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color={Colors.primary[600]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Coins size={20} color={Colors.warning[600]} />
              <Text style={styles.statValue}>{profile?.coins_earned || 0}</Text>
              <Text style={styles.statLabel}>Coins Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Shield size={20} color={Colors.primary[600]} />
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Active Policy</Text>
            </View>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={Colors.gray[600]} />
            <Text style={styles.sectionTitle}>{t('language')}</Text>
          </View>
          
          <View style={styles.languageOptions}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View style={styles.languageInfo}>
                  <Text
                    style={[
                      styles.languageName,
                      language === lang.code && styles.languageNameSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageSubtitle,
                      language === lang.code && styles.languageSubtitleSelected,
                    ]}
                  >
                    {lang.subtitle}
                  </Text>
                </View>
                {language === lang.code && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color={Colors.gray[600]} />
            <Text style={styles.sectionTitle}>{t('settings')}</Text>
          </View>

          <View style={styles.settingsOptions}>
            <TouchableOpacity 
              style={styles.settingOption}
              onPress={() => setShowPrivacy(true)}
            >
              <FileText size={20} color={Colors.gray[600]} />
              <Text style={styles.settingOptionText}>{t('privacyPolicy')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingOption}
              onPress={() => setShowTerms(true)}
            >
              <Shield size={20} color={Colors.gray[600]} />
              <Text style={styles.settingOptionText}>{t('termsOfService')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>🌾 Fasal Rakshak v1.0</Text>
          <Text style={styles.footerSubtext}>
            Empowering farmers with transparent crop insurance
          </Text>
        </View>

        {/* Privacy Policy Modal */}
        {renderModal(
          showPrivacy,
          () => setShowPrivacy(false),
          t('privacyPolicy'),
          t('privacyContent')
        )}

        {/* Terms of Service Modal */}
        {renderModal(
          showTerms,
          () => setShowTerms(false),
          t('termsOfService'),
          t('termsContent')
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
  },
  profileCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[200],
  },
  sectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  languageOptions: {
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  languageOptionSelected: {
    borderColor: Colors.primary[400],
    backgroundColor: Colors.primary[50],
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  languageNameSelected: {
    color: Colors.primary[700],
  },
  languageSubtitle: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  languageSubtitleSelected: {
    color: Colors.primary[600],
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[600],
  },
  settingsOptions: {
    gap: 12,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.gray[50],
  },
  settingOptionText: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary[700],
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.gray[700],
  },
});