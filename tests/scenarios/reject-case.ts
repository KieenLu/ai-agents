import { ClaimInput } from '../../src/domain/claim';

export interface TestScenario {
  name: string;
  claimInput: ClaimInput;
  expectedDecision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';
}

export const rejectCase: TestScenario = {
  name: 'REJECT_CASE',
  claimInput: {
    claimId: 'CLM-REJECT-001',
    policyId: 'POL-STANDARD-001',
    claimType: 'cosmetic_surgery',
    amount: 8000,
    diagnosis: 'Rhinoplasty for aesthetic enhancement',
    procedures: ['cosmetic rhinoplasty'],
    treatmentDate: '2026-03-20',
    submittedDocuments: ['DOC-101', 'DOC-102'],
  },
  expectedDecision: 'REJECT',
};