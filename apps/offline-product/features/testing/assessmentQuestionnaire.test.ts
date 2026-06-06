import {
  coerceFieldInput,
  formatFieldValueForInput,
  questionnaireFieldKey,
} from '@/features/api/assessmentQuestionnaire';

describe('assessmentQuestionnaire helpers', () => {
  it('builds stable field keys', () => {
    expect(questionnaireFieldKey('crop_details', 'crop_type')).toBe('crop_details.crop_type');
  });

  it('coerces numeric and array inputs', () => {
    expect(coerceFieldInput('number', '12.5')).toBe(12.5);
    expect(coerceFieldInput('array', '[{"product":"NPK"}]')).toEqual([{ product: 'NPK' }]);
  });

  it('formats stored values for text inputs', () => {
    expect(formatFieldValueForInput(2026)).toBe('2026');
    expect(formatFieldValueForInput([{ product: 'NPK' }])).toBe('[{"product":"NPK"}]');
  });
});
