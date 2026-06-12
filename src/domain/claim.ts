export interface Claim {
  claimId: string;
  policyId: string;
  claimType: string;
  amount: number;
  diagnosis: string;
  procedures: string[];
  treatmentDate?: string;
  submittedDocuments: string[];
}

export interface ClaimInput {
  claimId: string;
  policyId: string;
  claimType: string;
  amount: number;
  diagnosis: string;
  procedures: string[];
  treatmentDate?: string;
  submittedDocuments: string[];
}