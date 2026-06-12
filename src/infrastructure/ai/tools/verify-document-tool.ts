import { AiToolDefinition } from '../../../domain/tool-contracts';
import { MockDocumentTool } from '../../tools/mock-document-tool';
import { VerifyDocumentInput } from '../../../domain/tool-inputs';

const verifyDocumentParameters = {
  type: 'object',
  properties: {
    documentId: {
      type: 'string',
      description: 'The document ID to verify',
    },
  },
  required: ['documentId'],
  additionalProperties: false,
} as const;

export const verifyDocumentTool = (repository: MockDocumentTool): AiToolDefinition<VerifyDocumentInput> => ({
  description: 'Verify a submitted document for completeness and validity',
  parameters: verifyDocumentParameters,
  execute: async (input: VerifyDocumentInput) => repository.execute(input),
});
