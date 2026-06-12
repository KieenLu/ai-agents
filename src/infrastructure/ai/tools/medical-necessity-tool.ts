import { AiToolDefinition } from '../../../domain/tool-contracts';
import { MockMedicalNecessityTool } from '../../tools/mock-medical-necessity-tool';
import { CheckMedicalNecessityInput } from '../../../domain/tool-inputs';

const checkMedicalNecessityParameters = {
  type: 'object',
  properties: {
    diagnosis: {
      type: 'string',
      description: 'The patient diagnosis',
    },
    procedures: {
      type: 'array',
      description: 'List of procedures or treatments performed',
      items: {
        type: 'string',
      },
    },
  },
  required: ['diagnosis', 'procedures'],
  additionalProperties: false,
} as const;

export const checkMedicalNecessityTool = (repository: MockMedicalNecessityTool): AiToolDefinition<CheckMedicalNecessityInput> => ({
  description: 'Check if the treatment is medically necessary for the diagnosis',
  parameters: checkMedicalNecessityParameters,
  execute: async (input: CheckMedicalNecessityInput) => repository.execute(input),
});
