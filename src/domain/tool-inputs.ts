export interface VerifyDocumentInput {
  documentId: string;
}

export interface VerifyDocumentResult {
  documentId: string;
  documentType: string;
  completeness: 'complete' | 'incomplete' | 'missing' | 'type_mismatch';
  issues: string[];
  submittedDate: string;
}

export interface LookupPolicyInput {
  policyId: string;
}

export interface LookupPolicyResult {
  policyId: string;
  memberName: string;
  memberId: string;
  policyType: string;
  policyStartDate: string;
  policyEndDate: string;
  policyStatus: 'active' | 'inactive' | 'suspended';
  coverageInclusions: CoverageInclusionResult[];
  exclusions: ExclusionResult[];
  requiredDocuments: RequiredDocumentResult[];
}

export interface CoverageInclusionResult {
  claimType: string;
  isCovered: boolean;
  benefitLimit: number;
  copay: number;
  deductible: number;
  waitingPeriod: number;
  description: string;
}

export interface ExclusionResult {
  exclusionType: string;
  description: string;
  policyClause: string;
}

export interface RequiredDocumentResult {
  claimType: string;
  requiredDocs: string[];
}

export interface CheckMedicalNecessityInput {
  diagnosis: string;
  procedures: string[];
}

export interface CheckMedicalNecessityResult {
  diagnosis: string;
  procedures: string[];
  isClinicallySuitable: boolean;
  reasoning: string;
  confidenceScore: number;
}

export interface CalculateBenefitInput {
  policyId: string;
  claimType: string;
  amount: number;
}

export interface CalculateBenefitResult {
  policyId: string;
  claimType: string;
  submittedAmount: number;
  benefitLimit: number;
  copay: number;
  deductibleApplied: number;
  coveredAmount: number;
  memberResponsibility: number;
  remainingBenefitLimit: number;
  details: string;
}