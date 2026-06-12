import { ClaimInput } from '../../src/domain/claim';

export interface TestScenario {
  name: string;
  claimInput: ClaimInput;
  expectedDecision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';
}

export const approveCase: TestScenario = {
  name: 'APPROVE_CASE',
  claimInput: {
    claimId: 'CLM-APPROVE-001',
    policyId: 'POL-COMPREHENSIVE-001',
    claimType: 'inpatient_hospitalization',
    amount: 15000,
    diagnosis: 'Fractured tibia',
    procedures: ['orthopedic surgery'],
    treatmentDate: '2026-06-15',
    submittedDocuments: ['DOC-001', 'DOC-002', 'DOC-003'],
  },
  expectedDecision: 'APPROVE',
};