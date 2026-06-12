import { Router, Request, Response } from 'express';
import { ClaimInput } from '../../../domain/claim';
import { ClaimAgent } from '../../../infrastructure/ai/claim-agent';
import { MockDocumentTool } from '../../../infrastructure/tools/mock-document-tool';
import { MockPolicyTool } from '../../../infrastructure/tools/mock-policy-tool';
import { MockMedicalNecessityTool } from '../../../infrastructure/tools/mock-medical-necessity-tool';
import { MockBenefitTool } from '../../../infrastructure/tools/mock-benefit-tool';
import { DocumentRepository } from '../../../infrastructure/repositories/document-repository';
import { PolicyRepository } from '../../../infrastructure/repositories/policy-repository';

export const claimRouter = Router();

function validateClaimInput(body: unknown): ClaimInput {
  const claim = body as Partial<ClaimInput>;

  const requiredFields = [
    'claimId',
    'policyId',
    'claimType',
    'amount',
    'diagnosis',
    'procedures',
    'submittedDocuments',
  ];

  const missingFields = requiredFields.filter(field => claim[field as keyof ClaimInput] === undefined);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(claim.procedures)) {
    throw new Error('procedures must be an array');
  }

  if (!Array.isArray(claim.submittedDocuments)) {
    throw new Error('submittedDocuments must be an array');
  }

  if (typeof claim.amount !== 'number' || claim.amount <= 0) {
    throw new Error('amount must be a positive number');
  }

  return claim as ClaimInput;
}

claimRouter.post('/assess-claim', async (req: Request, res: Response) => {
  try {
    const claim = validateClaimInput(req.body);

    const documentRepository = new DocumentRepository();
    const policyRepository = new PolicyRepository();

    const documentTool = new MockDocumentTool(documentRepository);
    const policyTool = new MockPolicyTool(policyRepository);
    const medicalNecessityTool = new MockMedicalNecessityTool();
    const benefitTool = new MockBenefitTool(policyRepository);

    const agent = new ClaimAgent(
      documentTool,
      policyTool,
      medicalNecessityTool,
      benefitTool
    );

    const result = await agent.assess(claim);

    res.status(200).json(result.report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

claimRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  });
});