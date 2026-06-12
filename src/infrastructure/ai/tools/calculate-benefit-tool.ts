import { AiToolDefinition } from '../../../domain/tool-contracts';
import { MockBenefitTool } from '../../tools/mock-benefit-tool';
import { CalculateBenefitInput } from '../../../domain/tool-inputs';

const calculateBenefitParameters = {
  type: 'object',
  properties: {
    policyId: {
      type: 'string',
      description: 'The policy ID',
    },
    claimType: {
      type: 'string',
      description: 'The type of claim',
    },
    amount: {
      type: 'number',
      description: 'The submitted claim amount',
    },
  },
  required: ['policyId', 'claimType', 'amount'],
  additionalProperties: false,
} as const;

export const calculateBenefitTool = (repository: MockBenefitTool): AiToolDefinition<CalculateBenefitInput> => ({
  description: 'Calculate benefit coverage, copay, and member responsibility',
  parameters: calculateBenefitParameters,
  execute: async (input: CalculateBenefitInput) => repository.execute(input),
});
