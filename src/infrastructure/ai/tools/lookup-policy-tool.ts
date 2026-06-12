import { AiToolDefinition } from '../../../domain/tool-contracts';
import { MockPolicyTool } from '../../tools/mock-policy-tool';
import { LookupPolicyInput } from '../../../domain/tool-inputs';

const lookupPolicyParameters = {
  type: 'object',
  properties: {
    policyId: {
      type: 'string',
      description: 'The policy ID to lookup',
    },
  },
  required: ['policyId'],
  additionalProperties: false,
} as const;

export const lookupPolicyTool = (repository: MockPolicyTool): AiToolDefinition<LookupPolicyInput> => ({
  description: 'Lookup policy terms, benefits, limits, exclusions, and coverage rules',
  parameters: lookupPolicyParameters,
  execute: async (input: LookupPolicyInput) => repository.execute(input),
});
