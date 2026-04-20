export type JsonSchema = {
  type?: 'object' | 'string' | 'number' | 'boolean' | 'array';
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
};

export const EUDR_DDS_SCHEMA: JsonSchema = {
  type: 'object',
  required: ['declarationType', 'referenceNumber', 'operator', 'product'],
  properties: {
    declarationType: { type: 'string' },
    referenceNumber: { type: 'string' },
    operator: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        country: { type: 'string' },
      },
    },
    product: {
      type: 'object',
      required: ['commodity'],
      properties: {
        commodity: { type: 'string' },
        hsCode: { type: 'string' },
      },
    },
  },
};

export function validateJsonSchema(
  value: unknown,
  schema: JsonSchema,
  path = 'statement',
): { valid: true } | { valid: false; error: string } {
  if (!schema.type) return { valid: true };

  if (schema.type === 'string') {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return { valid: false, error: `${path} must be a non-empty string.` };
    }
    return { valid: true };
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { valid: false, error: `${path} must be a number.` };
    }
    return { valid: true };
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { valid: false, error: `${path} must be a boolean.` };
    }
    return { valid: true };
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return { valid: false, error: `${path} must be an array.` };
    }
    if (!schema.items) return { valid: true };
    for (let idx = 0; idx < value.length; idx += 1) {
      const itemResult = validateJsonSchema(value[idx], schema.items, `${path}[${idx}]`);
      if (!itemResult.valid) return itemResult;
    }
    return { valid: true };
  }

  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { valid: false, error: `${path} must be an object.` };
    }
    const objectValue = value as Record<string, unknown>;
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in objectValue)) {
        return { valid: false, error: `${path}.${requiredKey} is required.` };
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (!(key in objectValue)) continue;
      const propertyResult = validateJsonSchema(objectValue[key], propertySchema, `${path}.${key}`);
      if (!propertyResult.valid) return propertyResult;
    }
    return { valid: true };
  }

  return { valid: true };
}

export function validateEudrDdsStatement(statement: unknown) {
  return validateJsonSchema(statement, EUDR_DDS_SCHEMA, 'statement');
}

