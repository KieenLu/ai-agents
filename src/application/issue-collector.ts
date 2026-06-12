import { Issue } from './types/issues';
import { VerifyDocumentResult, LookupPolicyResult, CheckMedicalNecessityResult, CalculateBenefitResult } from '../domain/tool-inputs';
import { ClaimInput } from '../domain/claim';

export class IssueCollector {
  private issues: Issue[] = [];

  collectDocumentIssues(
    documents: VerifyDocumentResult[],
    requiredDocTypes: string[]
  ): void {
    for (const requiredType of requiredDocTypes) {
      const matchingDoc = documents.find(d => d.documentType === requiredType);
      
      if (!matchingDoc) {
        this.issues.push({
          type: 'DOCUMENT_MISSING',
          message: `Required document '${requiredType}' is missing from submission`,
        });
      } else if (matchingDoc.completeness === 'incomplete') {
        this.issues.push({
          type: 'DOCUMENT_INCOMPLETE',
          message: `Required document '${requiredType}' is incomplete: ${matchingDoc.issues.join(', ')}`,
          relatedDocument: matchingDoc.documentId,
        });
      } else if (matchingDoc.completeness === 'missing') {
        this.issues.push({
          type: 'DOCUMENT_MISSING',
          message: `Required document '${requiredType}' (ID: ${matchingDoc.documentId}) was not found in system`,
          relatedDocument: matchingDoc.documentId,
        });
      }
    }

    for (const doc of documents) {
      const isRequired = requiredDocTypes.includes(doc.documentType);
      const wrongType = !isRequired && requiredDocTypes.length > 0;
      
      if (wrongType && doc.completeness !== 'missing') {
        const expectedTypes = requiredDocTypes.filter(rt => !documents.some(d => d.documentType === rt));
        this.issues.push({
          type: 'DOCUMENT_TYPE_MISMATCH',
          message: `Document '${doc.documentType}' submitted but '${expectedTypes[0] || requiredDocTypes[0]}' was expected`,
          relatedDocument: doc.documentId,
        });
      }
    }
  }

  collectPolicyIssues(
    policy: LookupPolicyResult,
    claim: ClaimInput
  ): void {
    if (policy.policyStatus !== 'active') {
      this.issues.push({
        type: policy.policyStatus === 'suspended' ? 'POLICY_SUSPENDED' : 'POLICY_INACTIVE',
        message: `Policy status is '${policy.policyStatus}' - coverage not available`,
        policyClause: 'Policy Status Clause',
      });
    }

    const treatmentDate = claim.treatmentDate ? new Date(claim.treatmentDate) : undefined;
    const startDate = new Date(policy.policyStartDate);
    const endDate = new Date(policy.policyEndDate);

    if (treatmentDate && (treatmentDate < startDate || treatmentDate > endDate)) {
      this.issues.push({
        type: 'COVERAGE_PERIOD_INVALID',
        message: `Treatment date ${claim.treatmentDate} is outside policy coverage period (${policy.policyStartDate} to ${policy.policyEndDate})`,
        policyClause: 'Coverage Period Clause',
      });
    }

    const coverage = policy.coverageInclusions.find(
      (c: import('../domain/tool-inputs').CoverageInclusionResult) => c.claimType === claim.claimType
    );

    if (!coverage || !coverage.isCovered) {
      this.issues.push({
        type: 'CLAIM_TYPE_NOT_COVERED',
        message: `Claim type '${claim.claimType}' is not covered under this policy`,
        policyClause: 'Coverage Inclusions Clause',
      });
    } else if (treatmentDate) {
      const coverageStartDate = new Date(policy.policyStartDate);
      coverageStartDate.setDate(coverageStartDate.getDate() + coverage.waitingPeriod);
      
      if (treatmentDate < coverageStartDate) {
        this.issues.push({
          type: 'WAITING_PERIOD_NOT_SATISFIED',
          message: `Claim is within waiting period. Coverage begins ${coverageStartDate.toISOString().split('T')[0]}`,
          policyClause: `Waiting Period Clause (${coverage.waitingPeriod} days for ${claim.claimType})`,
        });
      }
    }

    const exclusion = policy.exclusions.find(
      (e: import('../domain/tool-inputs').ExclusionResult) => 
        e.exclusionType.toLowerCase().includes(claim.claimType.toLowerCase()) ||
        claim.claimType.toLowerCase().includes(e.exclusionType.toLowerCase())
    );

    if (exclusion) {
      this.issues.push({
        type: 'POLICY_EXCLUSION_APPLIES',
        message: `Treatment falls under policy exclusion: ${exclusion.description}`,
        policyClause: `Exclusion Clause ${exclusion.policyClause}`,
      });
    }
  }

  collectMedicalIssues(
    medicalNecessity: CheckMedicalNecessityResult
  ): void {
    if (!medicalNecessity.isClinicallySuitable) {
      this.issues.push({
        type: 'MEDICAL_NOT_APPROPRIATE',
        message: `Treatment not clinically appropriate: ${medicalNecessity.reasoning}`,
      });
    }

    if (medicalNecessity.confidenceScore < 0.7) {
      this.issues.push({
        type: 'MEDICAL_LOW_CONFIDENCE',
        message: `Low confidence (${medicalNecessity.confidenceScore}) in medical necessity assessment`,
      });
    }
  }

  collectBenefitIssues(
    benefit: CalculateBenefitResult,
    claim: ClaimInput,
    policy: LookupPolicyResult
  ): void {
    const exclusion = policy.exclusions.find(
      (e: import('../domain/tool-inputs').ExclusionResult) => 
        e.exclusionType.toLowerCase().includes(claim.claimType.toLowerCase()) ||
        claim.claimType.toLowerCase().includes(e.exclusionType.toLowerCase())
    );

    if (!exclusion && benefit.coveredAmount < claim.amount && benefit.benefitLimit > 0) {
      this.issues.push({
        type: 'BENEFIT_LIMIT_EXCEEDED',
        message: `Claim amount $${claim.amount} exceeds available benefit limit $${benefit.benefitLimit}`,
        policyClause: 'Benefit Limit Clause',
      });
    }
  }

  getIssues(): Issue[] {
    return [...this.issues];
  }

  clear(): void {
    this.issues = [];
  }

  hasIssues(): boolean {
    return this.issues.length > 0;
  }
}