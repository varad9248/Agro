import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { BookOpen, Coins, CircleCheck as CheckCircle, Circle as XCircle, Info } from 'lucide-react-native';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  coins: number;
}

const questions: Question[] = [
  {
    id: 'q1',
    question: 'What is basis risk in crop insurance?',
    options: [
      'The risk of crop damage',
      'The difference between actual loss and insurance payout',
      'The cost of insurance premium',
      'The time delay in claim processing',
    ],
    correctAnswer: 1,
    explanation: 'Basis risk occurs when the insurance payout doesn\'t match the actual loss experienced by the farmer.',
    coins: 10,
  },
  {
    id: 'q2',
    question: 'How does parametric insurance work?',
    options: [
      'Based on actual crop damage assessment',
      'Based on predefined weather parameters',
      'Based on market prices',
      'Based on farmer\'s income',
    ],
    correctAnswer: 1,
    explanation: 'Parametric insurance triggers payouts automatically when predefined weather parameters (like rainfall) cross certain thresholds.',
    coins: 15,
  },
  {
    id: 'q3',
    question: 'What is the main advantage of blockchain in insurance?',
    options: [
      'Lower premiums',
      'Faster claim processing',
      'Transparency and trust',
      'Better weather prediction',
    ],
    correctAnswer: 2,
    explanation: 'Blockchain provides transparency and immutable records, building trust between farmers and insurers.',
    coins: 20,
  },
  {
    id: 'q4',
    question: 'When does a drought parametric policy typically trigger?',
    options: [
      'When crops start wilting',
      'When rainfall drops below threshold',
      'When temperature exceeds 40°C',
      'When farmer reports damage',
    ],
    correctAnswer: 1,
    explanation: 'Drought policies trigger automatically when rainfall measurements drop below predefined thresholds.',
    coins: 15,
  },
  {
    id: 'q5',
    question: 'What data is used for weather-based insurance?',
    options: [
      'Satellite imagery only',
      'Weather station data only',
      'Both satellite and weather station data',
      'Farmer reports only',
    ],
    correctAnswer: 2,
    explanation: 'Modern parametric insurance uses multiple data sources including satellites and weather stations for accurate measurements.',
    coins: 10,
  },
];

export default function Education() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [totalCoins, setTotalCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const showInstructions = () => {
    Alert.alert(
      t('education'),
      t('educationInstructions'),
      [{ text: t('understand'), style: 'default' }]
    );
  };

  const loadProgress = async () => {
    try {
      if (!user) return;
      
      // Load user profile for coins
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins_earned')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setTotalCoins(profile.coins_earned);
      }

      // Load answered questions
      const { data: progress } = await supabase
        .from('education_progress')
        .select('question_id')
        .eq('user_id', user?.id);

      if (progress) {
        setAnsweredQuestions(new Set(progress.map(p => p.question_id)));
      }
    } catch (error) {
      console.warn('Education progress unavailable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const coinsEarned = isCorrect ? currentQuestion.coins : 0;

    setAnswered(true);

    try {
      // Save progress
      const { error: progressError } = await supabase
        .from('education_progress')
        .upsert({
          user_id: user?.id,
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          coins_earned: coinsEarned,
        }, {
          onConflict: 'user_id,question_id'
        });

      if (progressError) {
        console.error('Error saving progress:', progressError);
      }

      // Update user coins
      if (isCorrect) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            coins_earned: totalCoins + coinsEarned,
          })
          .eq('id', user?.id);

        if (!profileError) {
          setTotalCoins(prev => prev + coinsEarned);
          setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }

    // Show result
    Alert.alert(
      isCorrect ? t('correct') : t('incorrect'),
      currentQuestion.explanation + (isCorrect ? ` +${coinsEarned} coins!` : ''),
      [
        {
          text: 'Continue',
          onPress: () => {
            setAnswered(false);
            setSelectedAnswer(null);
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
            } else {
              // Reset to first question
              setCurrentQuestionIndex(0);
            }
          },
        },
      ]
    );
  };

  const getNextUnansweredQuestion = () => {
    const unanswered = questions.find(q => !answeredQuestions.has(q.id));
    if (unanswered) {
      const index = questions.findIndex(q => q.id === unanswered.id);
      setCurrentQuestionIndex(index);
    }
  };

  useEffect(() => {
    if (!loading && answeredQuestions.size > 0) {
      getNextUnansweredQuestion();
    }
  }, [loading, answeredQuestions]);

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

  const currentQuestion = questions[currentQuestionIndex];
  const isQuestionAnswered = answeredQuestions.has(currentQuestion.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <BookOpen size={24} color={Colors.primary[600]} />
          <Text style={styles.title}>{t('education')}</Text>
          <TouchableOpacity onPress={showInstructions} style={styles.infoButton}>
            <Info size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.coinsContainer}>
          <Coins size={20} color={Colors.warning[600]} />
          <Text style={styles.coinsText}>
            {t('coinsEarned')}: {totalCoins}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          {isQuestionAnswered && (
            <View style={styles.answeredBadge}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.answeredText}>{t('alreadyAnswered')}</Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.optionButtonSelected,
                  answered && index === currentQuestion.correctAnswer && styles.optionButtonCorrect,
                  answered && selectedAnswer === index && index !== currentQuestion.correctAnswer && styles.optionButtonIncorrect,
                  isQuestionAnswered && styles.optionButtonDisabled,
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={answered || isQuestionAnswered}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswer === index && styles.optionTextSelected,
                    answered && index === currentQuestion.correctAnswer && styles.optionTextCorrect,
                    answered && selectedAnswer === index && index !== currentQuestion.correctAnswer && styles.optionTextIncorrect,
                  ]}
                >
                  {option}
                </Text>
                
                {answered && index === currentQuestion.correctAnswer && (
                  <CheckCircle size={20} color={Colors.white} />
                )}
                {answered && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle size={20} color={Colors.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedAnswer !== null && !answered && !isQuestionAnswered && (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAnswer}>
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          )}

          {isQuestionAnswered && (
            <View style={styles.skipContainer}>
              <Text style={styles.skipText}>
                {t('alreadyAnswered')}. 
              </Text>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  const nextIndex = (currentQuestionIndex + 1) % questions.length;
                  setCurrentQuestionIndex(nextIndex);
                }}
              >
                <Text style={styles.skipButtonText}>{t('nextQuestion')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.rewardInfo}>
            <Text style={styles.rewardText}>
              🪙 {t('earnCoins')} - {currentQuestion.coins} {t('coinsEarned')}
            </Text>
          </View>
        </View>
      </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning[700],
  },
  content: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 2,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 20,
    lineHeight: 26,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  answeredText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: Colors.primary[400],
    backgroundColor: Colors.primary[50],
  },
  optionButtonCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  optionButtonIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: Colors.gray[700],
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: Colors.white,
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: Colors.white,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  skipText: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  skipButtonText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
  },
  rewardInfo: {
    backgroundColor: Colors.warning[50],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    color: Colors.warning[700],
    fontWeight: '500',
  },
});