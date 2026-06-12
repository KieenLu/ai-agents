export interface CoverageInclusion {
  claimType: string;
  isCovered: boolean;
  benefitLimit: number;
  copay: number;
  deductible: number;
  waitingPeriod: number;
  description: string;
}

export interface Exclusion {
  exclusionType: string;
  description: string;
  policyClause: string;
}

export interface RequiredDocument {
  claimType: string;
  requiredDocs: string[];
}

export interface Policy {
  policyId: string;
  memberName: string;
  memberId: string;
  policyType: string;
  policyStartDate: string;
  policyEndDate: string;
  policyStatus: 'active' | 'inactive' | 'suspended';
  coverageInclusions: CoverageInclusion[];
  exclusions: Exclusion[];
  requiredDocuments: RequiredDocument[];
}