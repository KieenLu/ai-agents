import {
  ClaimAssessmentReport,
  ToolCallLogEntry,
  DocumentReview,
  PolicyVerification,
  MedicalNecessity,
  BenefitCalculation,
  DocumentStatus,
} from '../domain/report';
import { ClaimInput } from '../domain/claim';
import { VerifyDocumentResult, LookupPolicyResult, CheckMedicalNecessityResult, CalculateBenefitResult } from '../domain/tool-inputs';
import { Issue } from './types/issues';
import { DecisionEngine } from './decision-engine';

export class ReportGenerator {
  constructor(private decisionEngine: DecisionEngine) {}

  generate(
    claim: ClaimInput,
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult,
    medicalNecessity: CheckMedicalNecessityResult,
    benefit: CalculateBenefitResult,
    issues: Issue[],
    toolLogs: ToolCallLogEntry[]
  ): ClaimAssessmentReport {
    const documentReview = this.buildDocumentReview(documents, policy, claim.claimType);
    const policyVerification = this.buildPolicyVerification(policy, claim, issues);
    const medical = this.buildMedicalNecessity(medicalNecessity);
    const benefitCalculation = this.buildBenefitCalculation(benefit);
    const recommendation = this.decisionEngine.makeDecision(issues);
    const citations = this.decisionEngine.generateCitations(issues, claim.claimId);

    return {
      claimId: claim.claimId,
      assessmentDate: new Date().toISOString(),
      documentReview,
      policyVerification,
      medicalNecessity: medical,
      benefitCalculation,
      recommendation,
      policyCitations: citations,
      toolCallLog: toolLogs,
    };
  }

  private buildDocumentReview(
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult,
    claimType: string
  ): DocumentReview {
    const requiredDocsForClaim = policy.requiredDocuments
      .find(rd => rd.claimType === claimType)?.requiredDocs ?? [];

    const documentMap = new Map(documents.map(d => [d.documentType, d]));
    
    const documentEntries: DocumentReview['documents'] = requiredDocsForClaim.map(docType => {
      const doc = documentMap.get(docType);
      
      if (!doc) {
        return {
          documentId: '',
          documentType: docType,
          status: 'missing' as DocumentStatus,
          issues: ['Document not submitted'],
          isRequired: true,
        };
      }
      
      return {
        documentId: doc.documentId,
        documentType: doc.documentType,
        status: this.mapCompletenessToStatus(doc.completeness),
        issues: doc.issues,
        isRequired: true,
      };
    });

    const allRequiredPresent = requiredDocsForClaim.every(reqType =>
      documents.some(d => d.documentType === reqType && d.completeness === 'complete')
    );

    return {
      summary: `${documents.length} documents submitted, ${requiredDocsForClaim.length} required for ${claimType}`,
      documents: documentEntries,
      allRequiredDocumentsPresent: allRequiredPresent,
    };
  }

  private mapCompletenessToStatus(
    completeness: VerifyDocumentResult['completeness']
  ): DocumentStatus {
    return completeness;
  }

  private buildPolicyVerification(
    policy: LookupPolicyResult,
    claim: ClaimInput,
    issues: Issue[]
  ): PolicyVerification {
    const coverage = policy.coverageInclusions.find(
      (c: import('../domain/tool-inputs').CoverageInclusionResult) => c.claimType === claim.claimType
    );

    const treatmentDate = claim.treatmentDate ? new Date(claim.treatmentDate) : undefined;
    const startDate = new Date(policy.policyStartDate);
    const endDate = new Date(policy.policyEndDate);
    const coverageValid = treatmentDate === undefined || (treatmentDate >= startDate && treatmentDate <= endDate);
    const coveragePeriodDetails = claim.treatmentDate
      ? `Policy active ${policy.policyStartDate} to ${policy.policyEndDate}, treatment date ${claim.treatmentDate} is ${coverageValid ? 'within' : 'outside'} coverage period`
      : 'Treatment date not provided; coverage period validation skipped';

    const policyIssues = issues.filter(i => 
      i.type === 'POLICY_INACTIVE' || 
      i.type === 'POLICY_SUSPENDED' ||
      i.type === 'COVERAGE_PERIOD_INVALID' ||
      i.type === 'CLAIM_TYPE_NOT_COVERED' ||
      i.type === 'WAITING_PERIOD_NOT_SATISFIED' ||
      i.type === 'POLICY_EXCLUSION_APPLIES'
    );

    return {
      policyId: policy.policyId,
      memberName: policy.memberName,
      policyStatus: policy.policyStatus,
      claimTypeIsCovered: coverage?.isCovered ?? false,
      coveragePeriodValid: coverageValid,
      coveragePeriodDetails,
      benefitLimit: coverage?.benefitLimit ?? 0,
      copay: coverage?.copay ?? 0,
      issues: policyIssues.map(i => i.message),
    };
  }

  private buildMedicalNecessity(
    medical: CheckMedicalNecessityResult
  ): MedicalNecessity {
    return {
      diagnosis: medical.diagnosis,
      procedures: medical.procedures,
      isClinicallySuitable: medical.isClinicallySuitable,
      reasoning: medical.reasoning,
      confidenceScore: medical.confidenceScore,
      issues: !medical.isClinicallySuitable 
        ? [`Treatment not appropriate: ${medical.reasoning}`]
        : medical.confidenceScore < 0.7 
          ? [`Low confidence score: ${medical.confidenceScore}`]
          : [],
    };
  }

  private buildBenefitCalculation(
    benefit: CalculateBenefitResult
  ): BenefitCalculation {
    return {
      submittedAmount: benefit.submittedAmount,
      benefitLimit: benefit.benefitLimit,
      coveredAmount: benefit.coveredAmount,
      copay: benefit.copay,
      deductible: benefit.deductibleApplied,
      memberResponsibility: benefit.memberResponsibility,
      insuranceResponsibility: benefit.coveredAmount - benefit.copay,
      remainingBenefitLimit: benefit.remainingBenefitLimit,
      details: benefit.details,
    };
  }
}