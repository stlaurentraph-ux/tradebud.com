export type QuestionnaireDataQuality = 'actual' | 'estimated' | 'defaulted';
export type QuestionnairePathway = 'annuals' | 'rice';

export type QuestionnaireSectionDefinition = {
  id: string;
  title: string;
  required: boolean;
  mapsTo: Array<'coolfarm' | 'sai'>;
  fields: Array<{
    id: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'enum' | 'array';
    required: boolean;
    unit?: string;
    dataQualityTracked: boolean;
  }>;
};

export type FarmQuestionnaireSchemaV1 = {
  schemaId: 'farmQuestionnaireV1';
  schemaVersion: '0.1.0-draft';
  pathway: QuestionnairePathway;
  stateModel: {
    initial: 'draft';
    allowedTransitions: Record<string, string[]>;
  };
  dataQuality: QuestionnaireDataQuality[];
  sections: QuestionnaireSectionDefinition[];
};

export type QuestionnaireFieldMapping = {
  sectionId: string;
  fieldId: string;
  coolfarmPath: string | null;
  saiIndicators: string[];
};

export type FarmQuestionnaireMappingRegistryV1 = {
  mappingId: 'farmQuestionnaireMappingV1';
  mappingVersion: '0.1.0-draft';
  pathway: QuestionnairePathway;
  mappings: QuestionnaireFieldMapping[];
};

const baseSections: QuestionnaireSectionDefinition[] = [
  {
    id: 'farm_assessment_context',
    title: 'Farm and assessment context',
    required: true,
    mapsTo: ['coolfarm', 'sai'],
    fields: [
      {
        id: 'assessment_year',
        label: 'Assessment year',
        type: 'number',
        required: true,
        dataQualityTracked: false,
      },
      {
        id: 'farm_country_code',
        label: 'Farm country code',
        type: 'string',
        required: true,
        dataQualityTracked: false,
      },
      {
        id: 'farm_boundary_scope',
        label: 'Boundary scope',
        type: 'enum',
        required: true,
        dataQualityTracked: false,
      },
    ],
  },
  {
    id: 'crop_details',
    title: 'Crop details',
    required: true,
    mapsTo: ['coolfarm', 'sai'],
    fields: [
      {
        id: 'crop_type',
        label: 'Crop type',
        type: 'string',
        required: true,
        dataQualityTracked: false,
      },
      {
        id: 'growing_area',
        label: 'Growing area',
        type: 'number',
        required: true,
        unit: 'ha',
        dataQualityTracked: true,
      },
      {
        id: 'crop_yield',
        label: 'Crop yield',
        type: 'number',
        required: true,
        unit: 'kg/ha',
        dataQualityTracked: true,
      },
    ],
  },
  {
    id: 'inputs',
    title: 'Inputs',
    required: true,
    mapsTo: ['coolfarm', 'sai'],
    fields: [
      {
        id: 'fertiliser_entries',
        label: 'Fertiliser applications',
        type: 'array',
        required: true,
        dataQualityTracked: true,
      },
      {
        id: 'pesticide_entries',
        label: 'Pesticide applications',
        type: 'array',
        required: true,
        dataQualityTracked: true,
      },
      {
        id: 'seed_production',
        label: 'Seed production',
        type: 'array',
        required: false,
        dataQualityTracked: true,
      },
    ],
  },
  {
    id: 'energy_operations',
    title: 'Energy and operations',
    required: true,
    mapsTo: ['coolfarm', 'sai'],
    fields: [
      {
        id: 'fuel_energy_entries',
        label: 'Fuel and energy',
        type: 'array',
        required: true,
        dataQualityTracked: true,
      },
      {
        id: 'irrigation_entries',
        label: 'Irrigation energy',
        type: 'array',
        required: true,
        dataQualityTracked: true,
      },
      {
        id: 'transport_entries',
        label: 'Transport entries',
        type: 'array',
        required: true,
        dataQualityTracked: true,
      },
    ],
  },
];

const riceOnlySections: QuestionnaireSectionDefinition[] = [
  {
    id: 'paddy_management',
    title: 'Paddy management',
    required: true,
    mapsTo: ['coolfarm'],
    fields: [
      {
        id: 'paddy_water_regime',
        label: 'Paddy water regime',
        type: 'enum',
        required: true,
        dataQualityTracked: true,
      },
    ],
  },
];

const annualsOnlySections: QuestionnaireSectionDefinition[] = [];

const allowedTransitions = {
  draft: ['submitted'],
  submitted: ['validated'],
  validated: ['scored'],
  scored: ['reviewed'],
  reviewed: [],
} satisfies Record<string, string[]>;

function buildPathwaySections(pathway: QuestionnairePathway): QuestionnaireSectionDefinition[] {
  return [...baseSections, ...(pathway === 'rice' ? riceOnlySections : annualsOnlySections)];
}

function createMapping(
  sectionId: string,
  fieldId: string,
  coolfarmPath: string | null,
  saiIndicators: string[],
): QuestionnaireFieldMapping {
  return { sectionId, fieldId, coolfarmPath, saiIndicators };
}

const baseMappings: QuestionnaireFieldMapping[] = [
  createMapping('farm_assessment_context', 'assessment_year', 'inputData.cropDetails.assessmentYear', ['FSA-ENV-01']),
  createMapping('farm_assessment_context', 'farm_country_code', 'inputData.cropDetails.country', ['FSA-MGMT-01']),
  createMapping('farm_assessment_context', 'farm_boundary_scope', null, ['FSA-MGMT-02']),
  createMapping('crop_details', 'crop_type', 'inputData.cropDetails.cropType', ['FSA-ENV-03']),
  createMapping('crop_details', 'growing_area', 'inputData.cropDetails.area', ['FSA-ENV-04']),
  createMapping('crop_details', 'crop_yield', 'inputData.cropDetails.cropYield', ['FSA-ENV-05']),
  createMapping('inputs', 'fertiliser_entries', 'inputData.fertiliser', ['FSA-ENV-06', 'FSA-SOC-02']),
  createMapping('inputs', 'pesticide_entries', 'inputData.pesticide', ['FSA-ENV-07', 'FSA-SOC-03']),
  createMapping('inputs', 'seed_production', 'inputData.seedProduction', ['FSA-ENV-08']),
  createMapping('energy_operations', 'fuel_energy_entries', 'inputData.fuelEnergy', ['FSA-ENV-09']),
  createMapping('energy_operations', 'irrigation_entries', 'inputData.irrigation', ['FSA-ENV-10']),
  createMapping('energy_operations', 'transport_entries', 'inputData.transport', ['FSA-ENV-11']),
];

const riceMappings: QuestionnaireFieldMapping[] = [
  createMapping('paddy_management', 'paddy_water_regime', 'inputData.paddy.waterRegime', ['FSA-ENV-12']),
];

function validateRequiredFieldCoverage(
  sections: QuestionnaireSectionDefinition[],
  mappings: QuestionnaireFieldMapping[],
) {
  const mappingKeySet = new Set(mappings.map((mapping) => `${mapping.sectionId}.${mapping.fieldId}`));
  const missing = sections
    .flatMap((section) =>
      section.fields
        .filter((field) => field.required)
        .map((field) => `${section.id}.${field.id}`),
    )
    .filter((requiredKey) => !mappingKeySet.has(requiredKey));

  if (missing.length > 0) {
    throw new Error(`Missing required question mappings: ${missing.join(', ')}`);
  }
}

export function buildFarmQuestionnaireSchemaV1(pathway: QuestionnairePathway): FarmQuestionnaireSchemaV1 {
  const sections = buildPathwaySections(pathway);
  return {
    schemaId: 'farmQuestionnaireV1',
    schemaVersion: '0.1.0-draft',
    pathway,
    stateModel: {
      initial: 'draft',
      allowedTransitions,
    },
    dataQuality: ['actual', 'estimated', 'defaulted'],
    sections,
  };
}

export function buildFarmQuestionnaireMappingRegistryV1(
  pathway: QuestionnairePathway,
): FarmQuestionnaireMappingRegistryV1 {
  const mappings = [...baseMappings, ...(pathway === 'rice' ? riceMappings : [])];
  validateRequiredFieldCoverage(buildPathwaySections(pathway), mappings);
  return {
    mappingId: 'farmQuestionnaireMappingV1',
    mappingVersion: '0.1.0-draft',
    pathway,
    mappings,
  };
}

