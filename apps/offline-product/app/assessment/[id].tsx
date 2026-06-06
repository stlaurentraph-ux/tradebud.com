import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brand, Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  coerceFieldInput,
  fetchAssessmentQuestionnaireDraft,
  fetchAssessmentQuestionnaireSchema,
  formatFieldValueForInput,
  questionnaireFieldKey,
  saveAssessmentQuestionnaireResponses,
  submitAssessmentQuestionnaire,
  type QuestionnaireSectionDefinition,
} from '@/features/api/assessmentQuestionnaire';
import {
  fetchAssignedAssessmentRequests,
  updateAssessmentRequestStatus,
  type FarmerAssessmentRequest,
} from '@/features/api/postPlot';

export default function AssessmentQuestionnaireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = typeof id === 'string' ? id : '';
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<FarmerAssessmentRequest | null>(null);
  const [sections, setSections] = useState<QuestionnaireSectionDefinition[]>([]);
  const [questionnaireStatus, setQuestionnaireStatus] = useState<string>('draft');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    if (!requestId) {
      setError(t('assessment_missing_request'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [schemaPayload, draftPayload, assigned] = await Promise.all([
        fetchAssessmentQuestionnaireSchema(requestId),
        fetchAssessmentQuestionnaireDraft(requestId),
        fetchAssignedAssessmentRequests(),
      ]);
      const matched = assigned.find((item) => item.id === requestId) ?? null;
      setRequest(matched);
      setSections(schemaPayload.schema.sections ?? []);
      setQuestionnaireStatus(draftPayload.status);
      const nextValues: Record<string, string> = {};
      for (const section of schemaPayload.schema.sections ?? []) {
        for (const field of section.fields) {
          const key = questionnaireFieldKey(section.id, field.id);
          nextValues[key] = formatFieldValueForInput(draftPayload.response?.[key]);
        }
      }
      setFieldValues(nextValues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('assessment_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [requestId, t]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  const responsePayload = useMemo(() => {
    const payload: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const key = questionnaireFieldKey(section.id, field.id);
        const raw = fieldValues[key] ?? '';
        if (!raw.trim() && !field.required) {
          continue;
        }
        payload[key] = coerceFieldInput(field.type, raw);
      }
    }
    return payload;
  }, [fieldValues, sections]);

  const handleSave = async () => {
    if (!requestId) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveAssessmentQuestionnaireResponses({
        requestId,
        response: responsePayload,
      });
      setQuestionnaireStatus(saved.status);
      setMessage(t('assessment_saved'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('assessment_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuestionnaire = async () => {
    if (!requestId) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await saveAssessmentQuestionnaireResponses({
        requestId,
        response: responsePayload,
      });
      const submitted = await submitAssessmentQuestionnaire(requestId);
      setQuestionnaireStatus(submitted.status);
      setMessage(t('assessment_questionnaire_submitted'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('assessment_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!requestId) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await updateAssessmentRequestStatus({ requestId, status: 'submitted' });
      setMessage(t('assessment_request_submitted'));
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('assessment_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = questionnaireStatus === 'draft';
  const canSubmitAssessment =
    questionnaireStatus === 'submitted' &&
    request &&
    ['opened', 'in_progress', 'needs_changes'].includes(request.status);

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold">{request?.title ?? t('assessment_form_title')}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {t('assessment_status_line', {
              requestStatus: request?.status ?? 'unknown',
              questionnaireStatus,
            })}
          </ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <ThemedScrollView contentContainerStyle={styles.container}>
          {request?.instructions ? (
            <Card variant="outlined" style={styles.card}>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                {request.instructions}
              </ThemedText>
            </Card>
          ) : null}

          {error ? (
            <Card variant="outlined" style={[styles.card, styles.errorCard]}>
              <ThemedText type="default" style={{ color: Brand.warning }}>
                {error}
              </ThemedText>
            </Card>
          ) : null}

          {message ? (
            <Card variant="outlined" style={[styles.card, styles.successCard]}>
              <ThemedText type="default" style={{ color: Brand.success }}>
                {message}
              </ThemedText>
            </Card>
          ) : null}

          {sections.map((section) => (
            <Card key={section.id} variant="outlined" style={styles.card}>
              <ThemedText type="defaultSemiBold">{section.title}</ThemedText>
              <View style={{ marginTop: 12, gap: 12 }}>
                {section.fields.map((field) => {
                  const key = questionnaireFieldKey(section.id, field.id);
                  return (
                    <View key={key} style={{ gap: 6 }}>
                      <ThemedText type="caption">
                        {field.label}
                        {field.required ? ' *' : ''}
                        {field.unit ? ` (${field.unit})` : ''}
                      </ThemedText>
                      <TextInput
                        value={fieldValues[key] ?? ''}
                        editable={canEdit}
                        onChangeText={(text) =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [key]: text,
                          }))
                        }
                        placeholder={
                          field.type === 'array'
                            ? t('assessment_array_placeholder')
                            : t('assessment_field_placeholder')
                        }
                        multiline={field.type === 'array'}
                        keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            color: colors.text,
                            backgroundColor: canEdit ? '#fff' : '#F3F4F6',
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </Card>
          ))}

          <View style={styles.actions}>
            {canEdit ? (
              <>
                <Button
                  onPress={() => void handleSave()}
                  disabled={saving || submitting}
                  loading={saving}
                >
                  {t('assessment_save_draft')}
                </Button>
                <Button
                  onPress={() => void handleSubmitQuestionnaire()}
                  disabled={saving || submitting}
                  loading={submitting}
                >
                  {t('assessment_submit_questionnaire')}
                </Button>
              </>
            ) : null}
            {canSubmitAssessment ? (
              <Button
                onPress={() => void handleSubmitAssessment()}
                disabled={submitting}
                loading={submitting}
              >
                {t('assessment_submit_to_dashboard')}
              </Button>
            ) : null}
          </View>
        </ThemedScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F4F5F3',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    gap: 8,
  },
  errorCard: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  successCard: {
    borderColor: '#86DDBE',
    backgroundColor: '#ECFDF5',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  actions: {
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
