export type DocumentIssueType =
  | 'DOCUMENT_MISSING'
  | 'DOCUMENT_INCOMPLETE'
  | 'DOCUMENT_TYPE_MISMATCH';

export type PolicyIssueType =
  | 'POLICY_INACTIVE'
  | 'POLICY_SUSPENDED'
  | 'COVERAGE_PERIOD_INVALID'
  | 'CLAIM_TYPE_NOT_COVERED'
  | 'WAITING_PERIOD_NOT_SATISFIED'
  | 'POLICY_EXCLUSION_APPLIES';

export type MedicalIssueType =
  | 'MEDICAL_NOT_APPROPRIATE'
  | 'MEDICAL_LOW_CONFIDENCE';

export type BenefitIssueType =
  | 'BENEFIT_LIMIT_EXCEEDED';

export type IssueType = DocumentIssueType | PolicyIssueType | MedicalIssueType | BenefitIssueType;

export interface Issue {
  type: IssueType;
  message: string;
  relatedDocument?: string;
  policyClause?: string;
}