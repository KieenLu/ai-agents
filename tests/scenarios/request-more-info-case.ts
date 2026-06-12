import { ClaimInput } from '../../src/domain/claim';

export interface TestScenario {
  name: string;
  claimInput: ClaimInput;
  expectedDecision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';
}

export const requestMoreInfoCase: TestScenario = {
  name: 'REQUEST_MORE_INFO_CASE',
  claimInput: {
    claimId: 'CLM-MOREINFO-001',
    policyId: 'POL-BASIC-001',
    claimType: 'outpatient_surgery',
    amount: 5000,
    diagnosis: 'Appendectomy',
    procedures: ['appendectomy'],
    treatmentDate: '2026-05-10',
    submittedDocuments: ['DOC-201', 'DOC-202'],
  },
  expectedDecision: 'REQUEST_MORE_INFO',
};