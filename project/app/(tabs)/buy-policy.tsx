import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { ChevronRight, ChevronLeft, CreditCard, MapPin, Wheat, Info } from 'lucide-react-native';

type Step = 1 | 2 | 3;

interface PolicyData {
  state: string;
  district: string;
  crop: string;
  premium: number;
  coverage: number;
}

export default function BuyPolicy() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState<PolicyData>({
    state: '',
    district: '',
    crop: '',
    premium: 0,
    coverage: 0,
  });

  const showInstructions = () => {
    Alert.alert(
      t('buyPolicy'),
      t('buyPolicyInstructions'),
      [{ text: t('understand'), style: 'default' }]
    );
  };

  const states = [
    'Maharashtra',
    'Punjab',
    'Haryana',
    'Uttar Pradesh',
    'Madhya Pradesh',
    'Gujarat',
    'Rajasthan',
    'Karnataka',
    'Andhra Pradesh',
    'Tamil Nadu',
  ];

  const districts = {
    Maharashtra: ['Pune', 'Mumbai', 'Nashik', 'Aurangabad', 'Nagpur'],
    Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    // Add more districts for other states as needed
  };

  const crops = [
    'Rice',
    'Wheat',
    'Cotton',
    'Sugarcane',
    'Maize',
    'Soybean',
    'Onion',
    'Potato',
    'Tomato',
    'Groundnut',
  ];

  const calculatePremiumAndCoverage = (state: string, crop: string) => {
    // Simple calculation logic - in real app, this would be more sophisticated
    const basePremium = 250;
    const baseCoverage = 10000;
    
    const stateMultiplier = state === 'Maharashtra' ? 1.2 : 1.0;
    const cropMultiplier = crop === 'Cotton' ? 1.5 : crop === 'Rice' ? 1.3 : 1.0;
    
    return {
      premium: Math.round(basePremium * stateMultiplier * cropMultiplier),
      coverage: Math.round(baseCoverage * stateMultiplier * cropMultiplier),
    };
  };

  const handleStateChange = (state: string) => {
    const { premium, coverage } = calculatePremiumAndCoverage(state, policyData.crop);
    setPolicyData(prev => ({
      ...prev,
      state,
      district: '',
      premium,
      coverage,
    }));
  };

  const handleCropChange = (crop: string) => {
    const { premium, coverage } = calculatePremiumAndCoverage(policyData.state, crop);
    setPolicyData(prev => ({
      ...prev,
      crop,
      premium,
      coverage,
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return policyData.state && policyData.district && policyData.crop;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

 const handlePayment = async () => {
  if (!user) return;

  setLoading(true);
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // 👇 Create payload
    const payload = {
      user_id: user.id,
      state: policyData.state,
      district: policyData.district,
      crop: policyData.crop,
      premium_amount: policyData.premium,
      coverage_amount: policyData.coverage,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
    };

    const res = await fetch('http://localhost:5000/api/policies/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      Alert.alert('Error', json.error || 'Something went wrong.');
    } else {
      Alert.alert('Success', 'Policy created successfully!');
    }
  } catch (err) {
    Alert.alert('Error', 'Could not connect. Try again.');
  } finally {
    setLoading(false);
  }
};

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <MapPin size={24} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{t('selectDetails')}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('state')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={policyData.state}
            onValueChange={handleStateChange}
            style={styles.picker}
          >
            <Picker.Item label={`Select ${t('state')}`} value="" />
            {states.map((state) => (
              <Picker.Item key={state} label={state} value={state} />
            ))}
          </Picker>
        </View>
      </View>

      {policyData.state && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('district')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={policyData.district}
              onValueChange={(district) =>
                setPolicyData(prev => ({ ...prev, district }))
              }
              style={styles.picker}
            >
              <Picker.Item label={`Select ${t('district')}`} value="" />
              {(districts[policyData.state] || []).map((district) => (
                <Picker.Item key={district} label={district} value={district} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('crop')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={policyData.crop}
            onValueChange={handleCropChange}
            style={styles.picker}
          >
            <Picker.Item label={`Select ${t('crop')}`} value="" />
            {crops.map((crop) => (
              <Picker.Item key={crop} label={crop} value={crop} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Wheat size={24} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{t('reviewPolicy')}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Policy Summary</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('state')}:</Text>
          <Text style={styles.reviewValue}>{policyData.state}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('district')}:</Text>
          <Text style={styles.reviewValue}>{policyData.district}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('crop')}:</Text>
          <Text style={styles.reviewValue}>{policyData.crop}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('premium')}:</Text>
          <Text style={styles.reviewValueHighlight}>
            ₹{policyData.premium.toLocaleString('en-IN')}
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('droughtCoverage')}:</Text>
          <Text style={styles.reviewValueHighlight}>
            ₹{policyData.coverage.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <CreditCard size={24} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{t('payment')}</Text>
      </View>

      <View style={styles.paymentCard}>
        <Text style={styles.paymentTitle}>Payment Details</Text>
        <View style={styles.paymentAmount}>
          <Text style={styles.paymentLabel}>Total Amount:</Text>
          <Text style={styles.paymentValue}>
            ₹{policyData.premium.toLocaleString('en-IN')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.payButtonText}>{t('payWithUPI')}</Text>
              <Text style={styles.payButtonSubtext}>Secure Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('buyPolicy')}</Text>
          <TouchableOpacity onPress={showInstructions} style={styles.infoButton}>
            <Info size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>
        {renderStepIndicator()}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {currentStep < 3 && (
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={20} color={Colors.gray[600]} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNextStep() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceedToNextStep()}
          >
            <Text style={styles.nextButtonText}>{t('continue')}</Text>
            <ChevronRight size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    marginTop : 20,
    padding: 24,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary[600],
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.gray[600],
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary[600],
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary[200],
  },
  picker: {
    height: 50,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  reviewValueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[600],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 12,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 20,
  },
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  paymentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary[600],
  },
  payButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButtonSubtext: {
    color: Colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.gray[600],
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});