import { Policy } from '../../domain/policy';

export const mockPolicies: Policy[] = [
  {
    policyId: 'POL-COMPREHENSIVE-001',
    memberName: 'John Smith',
    memberId: 'MEM-001',
    policyType: 'comprehensive',
    policyStartDate: '2024-01-01',
    policyEndDate: '2026-12-31',
    policyStatus: 'active',
    coverageInclusions: [
      {
        claimType: 'inpatient_hospitalization',
        isCovered: true,
        benefitLimit: 50000,
        copay: 500,
        deductible: 1000,
        waitingPeriod: 0,
        description: 'Inpatient hospitalization coverage including surgical procedures',
      },
      {
        claimType: 'outpatient_surgery',
        isCovered: true,
        benefitLimit: 20000,
        copay: 300,
        deductible: 500,
        waitingPeriod: 0,
        description: 'Outpatient surgical procedures and minor treatments',
      },
      {
        claimType: 'lab_test',
        isCovered: true,
        benefitLimit: 10000,
        copay: 100,
        deductible: 200,
        waitingPeriod: 0,
        description: 'Laboratory tests and diagnostic procedures',
      },
    ],
    exclusions: [
      {
        exclusionType: 'cosmetic_surgery',
        description: 'Cosmetic procedures and treatments for aesthetic enhancement only',
        policyClause: '4.2',
      },
      {
        exclusionType: 'experimental_treatment',
        description: 'Experimental or investigational treatments not yet approved',
        policyClause: '4.5',
      },
    ],
    requiredDocuments: [
      {
        claimType: 'inpatient_hospitalization',
        requiredDocs: ['medical_receipt', 'discharge_summary', 'doctor_note'],
      },
      {
        claimType: 'outpatient_surgery',
        requiredDocs: ['medical_receipt', 'discharge_summary'],
      },
      {
        claimType: 'lab_test',
        requiredDocs: ['lab_results', 'doctor_prescription'],
      },
    ],
  },
  {
    policyId: 'POL-BASIC-002',
    memberName: 'Jane Doe',
    memberId: 'MEM-002',
    policyType: 'basic',
    policyStartDate: '2025-01-01',
    policyEndDate: '2026-12-31',
    policyStatus: 'active',
    coverageInclusions: [
      {
        claimType: 'outpatient_surgery',
        isCovered: true,
        benefitLimit: 15000,
        copay: 250,
        deductible: 0,
        waitingPeriod: 0,
        description: 'Outpatient surgical procedures',
      },
      {
        claimType: 'inpatient_hospitalization',
        isCovered: true,
        benefitLimit: 30000,
        copay: 500,
        deductible: 1000,
        waitingPeriod: 30,
        description: 'Inpatient hospital stays',
      },
    ],
    exclusions: [
      {
        exclusionType: 'cosmetic_surgery',
        description: 'Cosmetic procedures are excluded from coverage',
        policyClause: '4.2',
      },
    ],
    requiredDocuments: [
      {
        claimType: 'outpatient_surgery',
        requiredDocs: ['medical_receipt', 'discharge_summary'],
      },
      {
        claimType: 'inpatient_hospitalization',
        requiredDocs: ['medical_receipt', 'discharge_summary', 'doctor_note'],
      },
    ],
  },
  {
    policyId: 'POL-INACTIVE-003',
    memberName: 'Bob Wilson',
    memberId: 'MEM-003',
    policyType: 'basic',
    policyStartDate: '2023-01-01',
    policyEndDate: '2024-12-31',
    policyStatus: 'inactive',
    coverageInclusions: [
      {
        claimType: 'inpatient_hospitalization',
        isCovered: true,
        benefitLimit: 50000,
        copay: 500,
        deductible: 1000,
        waitingPeriod: 0,
        description: 'Inpatient hospitalization',
      },
    ],
    exclusions: [],
    requiredDocuments: [
      {
        claimType: 'inpatient_hospitalization',
        requiredDocs: ['medical_receipt', 'discharge_summary'],
      },
    ],
  },
];