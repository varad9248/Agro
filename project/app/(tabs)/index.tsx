import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Sun, CloudRain, TrendingUp, ExternalLink, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';

interface Policy {
  id: string;
  crop: string;
  coverage_amount: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface Claim {
  id: string;
  trigger_event: string;
  payout_amount: number;
  status: string;
  blockchain_tx_hash?: string;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [latestClaim, setLatestClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    // Refresh data when screen is focused
    const interval = setInterval(() => {
      if (user) {
        loadDashboardData();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  const showInstructions = () => {
    Alert.alert(
      t('dashboard'),
      t('dashboardInstructions'),
      [{ text: t('understand'), style: 'default' }]
    );
  };

  const loadDashboardData = async () => {
    try {
      if (!user) return;
      
      // Load active policy
      const { data: policies } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (policies && policies.length > 0) {
        setActivePolicy(policies[0]);

        // Load latest claim for this policy
        const { data: claims } = await supabase
          .from('claims')
          .select('*')
          .eq('policy_id', policies[0].id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (claims && claims.length > 0) {
          setLatestClaim(claims[0]);
        }
      }
    } catch (error) {
      console.warn('Dashboard data unavailable:', error);
      // Continue with demo data when offline
    } finally {
      setLoading(false);
    }
  };

  const getClaimStatusInfo = () => {
    if (!latestClaim) {
      return {
        text: t('noClaimTriggered'),
        icon: <TrendingUp size={24} color={Colors.primary[600]} />,
        color: Colors.primary[600],
        bgColor: Colors.primary[50],
      };
    }

    switch (latestClaim.status) {
      case 'triggered':
        return {
          text: t('droughtAlert'),
          icon: <AlertTriangle size={24} color={Colors.warning[600]} />,
          color: Colors.warning[600],
          bgColor: Colors.warning[50],
        };
      case 'processing':
        return {
          text: `${t('payoutProcessing')} ₹${latestClaim.payout_amount.toLocaleString('en-IN')}`,
          icon: <TrendingUp size={24} color={Colors.secondary[600]} />,
          color: Colors.secondary[600],
          bgColor: Colors.secondary[50],
        };
      case 'completed':
        return {
          text: `✅ ₹${latestClaim.payout_amount.toLocaleString('en-IN')} Credited`,
          icon: <TrendingUp size={24} color={Colors.primary[600]} />,
          color: Colors.primary[600],
          bgColor: Colors.primary[50],
        };
      default:
        return {
          text: t('noClaimTriggered'),
          icon: <TrendingUp size={24} color={Colors.primary[600]} />,
          color: Colors.primary[600],
          bgColor: Colors.primary[50],
        };
    }
  };

  const getProgressPercentage = () => {
    if (!activePolicy) return 0;
    
    const startDate = new Date(activePolicy.start_date);
    const endDate = new Date(activePolicy.end_date);
    const currentDate = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    
    return Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
  };

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

  const claimStatusInfo = getClaimStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🌾 Fasal Rakshak</Text>
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>{t('dashboard')}</Text>
            <TouchableOpacity onPress={showInstructions} style={styles.infoButton}>
              <Info size={20} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Sun size={28} color={Colors.warning[500]} />
            <Text style={styles.weatherTitle}>{t('weather')}</Text>
          </View>
          <View style={styles.weatherContent}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherTemp}>34°C</Text>
              <Text style={styles.weatherLabel}>Temperature</Text>
            </View>
            <View style={styles.weatherItem}>
              <CloudRain size={20} color={Colors.secondary[500]} />
              <Text style={styles.weatherRain}>15mm</Text>
              <Text style={styles.weatherLabel}>Today's Rain</Text>
            </View>
          </View>
        </View>

        {/* Active Policy Card */}
        {activePolicy ? (
          <View style={styles.policyCard}>
            <Text style={styles.cardTitle}>{t('activePolicy')}</Text>
            <View style={styles.policyContent}>
              <View style={styles.policyInfo}>
                <Text style={styles.cropName}>🌾 {activePolicy.crop}</Text>
                <Text style={styles.coverageAmount}>
                  ₹{activePolicy.coverage_amount.toLocaleString('en-IN')} {t('coverage')}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgressPercentage())}% Complete
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noPolicyCard}>
            <Text style={styles.noPolicyText}>No Active Policy</Text>
            <Text style={styles.noPolicySubtext}>Buy a policy to protect your crops</Text>
          </View>
        )}

        {/* Claim Status Card */}
        <View style={[styles.claimCard, { backgroundColor: claimStatusInfo.bgColor }]}>
          <View style={styles.claimHeader}>
            {claimStatusInfo.icon}
            <Text style={styles.cardTitle}>{t('claimStatus')}</Text>
          </View>
          <Text style={[styles.claimStatus, { color: claimStatusInfo.color }]}>
            {claimStatusInfo.text}
          </Text>
          {latestClaim?.blockchain_tx_hash && (
            <TouchableOpacity style={styles.blockchainLink}>
              <ExternalLink size={16} color={Colors.secondary[600]} />
              <Text style={styles.blockchainLinkText}>{t('seeOnBlockchain')}</Text>
            </TouchableOpacity>
          )}
        </View>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    marginTop : 20,
    padding: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray[600],
    marginTop: 4,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
  },
  weatherCard: {
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
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[700],
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherItem: {
    alignItems: 'center',
    gap: 4,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.warning[600],
  },
  weatherRain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary[600],
  },
  weatherLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  policyCard: {
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
  noPolicyCard: {
    backgroundColor: Colors.gray[100],
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  noPolicyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  noPolicySubtext: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[700],
    marginBottom: 12,
  },
  policyContent: {
    gap: 16,
  },
  policyInfo: {
    gap: 8,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  coverageAmount: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  claimCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  claimStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  blockchainLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockchainLinkText: {
    fontSize: 14,
    color: Colors.secondary[600],
    fontWeight: '600',
  },
});