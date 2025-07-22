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
import { CloudRain, Zap, Send, CircleCheck as CheckCircle, Clock, ExternalLink, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';

interface Claim {
  id: string;
  trigger_event: string;
  trigger_date: string;
  payout_amount: number;
  status: 'triggered' | 'processing' | 'completed';
  blockchain_tx_hash?: string;
  created_at: string;
}

export default function Claims() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const showInstructions = () => {
    Alert.alert(
      t('claims'),
      t('claimsInstructions'),
      [{ text: t('understand'), style: 'default' }]
    );
  };

  useEffect(() => {
    if (user) {
      loadClaims();
    }
  }, [user]);

  const loadClaims = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Claims data unavailable:', error);
      } else {
        setClaims(data || []);
      }
    } catch (error) {
      console.warn('Claims connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineData = (claim: Claim) => {
    const events = [
      {
        id: 1,
        title: t('weatherConditionMet'),
        description: `${claim.trigger_event} on ${new Date(claim.trigger_date).toLocaleDateString()}`,
        icon: <CloudRain size={20} color={Colors.warning[600]} />,
        completed: true,
        date: claim.trigger_date,
      },
      {
        id: 2,
        title: t('smartContractTriggered'),
        description: 'Blockchain smart contract automatically executed',
        icon: <Zap size={20} color={Colors.secondary[600]} />,
        completed: true,
        date: claim.created_at,
      },
      {
        id: 3,
        title: t('payoutSent'),
        description: `₹${claim.payout_amount.toLocaleString('en-IN')} sent to your bank account`,
        icon: <Send size={20} color={Colors.primary[600]} />,
        completed: claim.status !== 'triggered',
        date: claim.status !== 'triggered' ? claim.created_at : null,
      },
      {
        id: 4,
        title: t('amountCredited'),
        description: 'Amount successfully credited to your account',
        icon: <CheckCircle size={20} color={Colors.success} />,
        completed: claim.status === 'completed',
        date: claim.status === 'completed' ? claim.created_at : null,
      },
    ];

    return events;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered':
        return Colors.warning[600];
      case 'processing':
        return Colors.secondary[600];
      case 'completed':
        return Colors.success;
      default:
        return Colors.gray[600];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'triggered':
        return 'Claim Triggered';
      case 'processing':
        return 'Processing Payout';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderTimelineEvent = (event: any, isLast: boolean) => (
    <View key={event.id} style={styles.timelineEvent}>
      <View style={styles.timelineIconContainer}>
        <View
          style={[
            styles.timelineIcon,
            { backgroundColor: event.completed ? Colors.primary[100] : Colors.gray[100] },
          ]}
        >
          {event.icon}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: event.completed ? Colors.primary[300] : Colors.gray[300] },
            ]}
          />
        )}
      </View>
      
      <View style={styles.timelineContent}>
        <Text
          style={[
            styles.timelineTitle,
            { color: event.completed ? Colors.gray[800] : Colors.gray[500] },
          ]}
        >
          {event.title}
        </Text>
        <Text
          style={[
            styles.timelineDescription,
            { color: event.completed ? Colors.gray[600] : Colors.gray[400] },
          ]}
        >
          {event.description}
        </Text>
        {event.date && (
          <Text style={styles.timelineDate}>
            {new Date(event.date).toLocaleDateString()} at{' '}
            {new Date(event.date).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );

  const renderClaimCard = (claim: Claim) => {
    const timelineData = getTimelineData(claim);
    
    return (
      <View key={claim.id} style={styles.claimCard}>
        <View style={styles.claimHeader}>
          <View style={styles.claimInfo}>
            <Text style={styles.claimAmount}>
              ₹{claim.payout_amount.toLocaleString('en-IN')}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(claim.status) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(claim.status) },
                ]}
              >
                {getStatusText(claim.status)}
              </Text>
            </View>
          </View>
          
          {claim.blockchain_tx_hash && (
            <TouchableOpacity style={styles.blockchainButton}>
              <ExternalLink size={16} color={Colors.secondary[600]} />
              <Text style={styles.blockchainButtonText}>
                {t('seeOnBlockchain')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.timeline}>
          <Text style={styles.timelineHeaderTitle}>{t('claimTimeline')}</Text>
          {timelineData.map((event, index) =>
            renderTimelineEvent(event, index === timelineData.length - 1)
          )}
        </View>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('claims')}</Text>
            <Text style={styles.subtitle}>Automated Claim Processing</Text>
          </View>
          <TouchableOpacity onPress={showInstructions} style={styles.infoButton}>
            <Info size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {claims.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color={Colors.gray[400]} />
            <Text style={styles.emptyStateTitle}>No Claims Found</Text>
            <Text style={styles.emptyStateText}>
              Your claims will appear here when weather conditions trigger payouts
            </Text>
          </View>
        ) : (
          <View style={styles.claimsContainer}>
            {claims.map(renderClaimCard)}
          </View>
        )}

        {/* Demo Timeline for users without claims */}
        {claims.length === 0 && (
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>How Automated Claims Work</Text>
            <View style={styles.demoTimeline}>
              {getTimelineData({
                id: 'demo',
                trigger_event: 'Low Rainfall Detected (Below 15mm)',
                trigger_date: '2024-07-15',
                payout_amount: 10000,
                status: 'completed',
                created_at: '2024-07-15T10:00:00Z',
                blockchain_tx_hash: 'demo_hash',
              }).map((event, index, array) =>
                renderTimelineEvent(event, index === array.length - 1)
              )}
            </View>
          </View>
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
  header: {
    marginTop: 20,
    padding: 24,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 4,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  claimsContainer: {
    padding: 24,
    gap: 20,
  },
  claimCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  claimInfo: {
    flex: 1,
  },
  claimAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary[600],
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockchainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary[50],
    borderRadius: 8,
  },
  blockchainButtonText: {
    fontSize: 12,
    color: Colors.secondary[600],
    fontWeight: '600',
  },
  timeline: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: 20,
  },
  timelineHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  timelineEvent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  demoContainer: {
    margin: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  demoTimeline: {
    // Timeline styles are reused
  },
});