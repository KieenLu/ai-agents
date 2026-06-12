export type Decision = 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';

export type DocumentStatus = 'complete' | 'incomplete' | 'missing' | 'type_mismatch';

export interface DocumentReview {
  summary: string;
  documents: DocumentReviewEntry[];
  allRequiredDocumentsPresent: boolean;
}

export interface DocumentReviewEntry {
  documentId: string;
  documentType: string;
  status: DocumentStatus;
  issues: string[];
  isRequired: boolean;
}

export interface Result<T> {
  success: true;
  value: T;
}

export interface ErrorResult {
  success: false;
  error: string;
  code: string;
}

export type ResultOrError<T> = Result<T> | ErrorResult;

export interface PolicyVerification {
  policyId: string;
  memberName: string;
  policyStatus: 'active' | 'inactive' | 'suspended';
  claimTypeIsCovered: boolean;
  coveragePeriodValid: boolean;
  coveragePeriodDetails: string;
  benefitLimit: number;
  copay: number;
  issues: string[];
}

export interface MedicalNecessity {
  diagnosis: string;
  procedures: string[];
  isClinicallySuitable: boolean;
  reasoning: string;
  confidenceScore: number;
  issues: string[];
}

export interface BenefitCalculation {
  submittedAmount: number;
  benefitLimit: number;
  coveredAmount: number;
  copay: number;
  deductible: number;
  memberResponsibility: number;
  insuranceResponsibility: number;
  remainingBenefitLimit: number;
  details: string;
}

export interface Recommendation {
  decision: Decision;
  primaryReason: string;
  secondaryReasons: string[];
  actionItems: string[];
}

export interface PolicyCitation {
  clause: string;
  clauseName: string;
  citedText: string;
  applicationToThisClaim: string;
}

export interface ToolCallLogEntry {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
  sequenceNumber: number;
}

export interface ClaimAssessmentReport {
  claimId: string;
  assessmentDate: string;
  
  documentReview: DocumentReview;
  policyVerification: PolicyVerification;
  medicalNecessity: MedicalNecessity;
  benefitCalculation: BenefitCalculation;
  recommendation: Recommendation;
  policyCitations: PolicyCitation[];
  toolCallLog: ToolCallLogEntry[];
}