import { generateText } from 'ai';
import { IssueCollector } from '../../application/issue-collector';
import { DecisionEngine } from '../../application/decision-engine';
import { Issue } from '../../application/types/issues';
import { ClaimInput } from '../../domain/claim';
import {
  ClaimAssessmentReport,
  DocumentReview,
  DocumentReviewEntry,
  PolicyCitation,
  PolicyVerification,
  Recommendation,
  ToolCallLogEntry,
} from '../../domain/report';
import {
  CalculateBenefitResult,
  CheckMedicalNecessityResult,
  CoverageInclusionResult,
  ExclusionResult,
  LookupPolicyResult,
  RequiredDocumentResult,
  VerifyDocumentResult,
} from '../../domain/tool-inputs';
import { CLAIM_ASSESSMENT_SYSTEM_PROMPT } from '../../config/system-prompt';
import { groqModel } from './groq-provider';
import { MockDocumentTool } from '../tools/mock-document-tool';
import { MockPolicyTool } from '../tools/mock-policy-tool';
import { MockMedicalNecessityTool } from '../tools/mock-medical-necessity-tool';
import { MockBenefitTool } from '../tools/mock-benefit-tool';

export interface AgentResult {
  report: ClaimAssessmentReport;
  toolLogs: ToolCallLogEntry[];
  rawResponse: string;
}

type GroqTextGenerator = (options: {
  model: unknown;
  system: string;
  prompt: string;
}) => Promise<{ text: string }>;

const generateTextClient = generateText as GroqTextGenerator;

export class ClaimAgent {
  private readonly decisionEngine = new DecisionEngine();

  constructor(
    private documentTool: MockDocumentTool,
    private policyTool: MockPolicyTool,
    private medicalNecessityTool: MockMedicalNecessityTool,
    private benefitTool: MockBenefitTool
  ) {}

  async assess(claim: ClaimInput): Promise<AgentResult> {
    const toolLogs: ToolCallLogEntry[] = [];
    const documentResults: VerifyDocumentResult[] = [];

    for (const documentId of claim.submittedDocuments) {
      const input = { documentId };
      const output = await this.documentTool.execute(input);
      this.logToolCall(toolLogs, 'verifyDocument', input, output);
      documentResults.push(output);
    }

    const policyInput = { policyId: claim.policyId };
    const policy = await this.policyTool.execute(policyInput);
    this.logToolCall(toolLogs, 'lookupPolicy', policyInput, policy);

    const medicalInput = {
      diagnosis: claim.diagnosis,
      procedures: [...claim.procedures],
    };
    const medicalNecessity = await this.medicalNecessityTool.execute(medicalInput);
    this.logToolCall(toolLogs, 'checkMedicalNecessity', medicalInput, medicalNecessity);

    const benefitInput = {
      policyId: claim.policyId,
      claimType: claim.claimType,
      amount: claim.amount,
    };
    const benefit = await this.benefitTool.execute(benefitInput);
    this.logToolCall(toolLogs, 'calculateBenefit', benefitInput, benefit);

    const issues = this.collectIssues(claim, documentResults, policy, medicalNecessity, benefit);
    const recommendation = this.decisionEngine.makeDecision(issues);
    const report = this.buildReport(
      claim,
      documentResults,
      policy,
      medicalNecessity,
      benefit,
      issues,
      recommendation,
      toolLogs
    );
    const synthesizedReport = await this.synthesizeReportWithGroq(claim, report);
    const finalReport = this.mergeSynthesizedReport(report, synthesizedReport);

    return {
      report: finalReport,
      toolLogs,
      rawResponse: JSON.stringify(finalReport),
    };
  }

  private async synthesizeReportWithGroq(
    claim: ClaimInput,
    deterministicReport: ClaimAssessmentReport
  ): Promise<ClaimAssessmentReport> {
    console.log('=== GROQ INFERENCE START ===');

    const result = await generateTextClient({
      model: groqModel,
      system: CLAIM_ASSESSMENT_SYSTEM_PROMPT,
      prompt: this.buildGroqPrompt(claim, deterministicReport),
    });

    return this.parseReport(result.text);
  }

  private buildGroqPrompt(
    claim: ClaimInput,
    deterministicReport: ClaimAssessmentReport
  ): string {
    const context = {
      instruction:
        'Synthesize the final claim assessment report using only the supplied claim input and tool outputs. Do not invent policy terms. Preserve the exact JSON structure. Preserve the toolCallLog exactly. Use the deterministic recommendation decision as the source of truth for the final decision.',
      claimInput: claim,
      deterministicReport,
    };

    return JSON.stringify(context, null, 2);
  }

  private parseReport(rawResponse: string): ClaimAssessmentReport {
    try {
      const jsonStart = rawResponse.indexOf('{');
      const jsonEnd = rawResponse.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('Response does not contain valid JSON');
      }

      const jsonString = rawResponse.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonString) as ClaimAssessmentReport;
    } catch (error) {
      throw new Error(`Failed to parse Groq report JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mergeSynthesizedReport(
    deterministicReport: ClaimAssessmentReport,
    synthesizedReport: ClaimAssessmentReport
  ): ClaimAssessmentReport {
    return {
      claimId: deterministicReport.claimId,
      assessmentDate: deterministicReport.assessmentDate,
      documentReview: deterministicReport.documentReview,
      policyVerification: deterministicReport.policyVerification,
      medicalNecessity: deterministicReport.medicalNecessity,
      benefitCalculation: deterministicReport.benefitCalculation,
      recommendation: {
        ...synthesizedReport.recommendation,
        decision: deterministicReport.recommendation.decision,
      },
      policyCitations: synthesizedReport.policyCitations.length > 0
        ? synthesizedReport.policyCitations
        : deterministicReport.policyCitations,
      toolCallLog: deterministicReport.toolCallLog,
    };
  }

  private logToolCall<TInput extends object, TOutput>(
    toolLogs: ToolCallLogEntry[],
    toolName: string,
    input: TInput,
    output: TOutput
  ): void {
    toolLogs.push({
      toolName,
      input: input as Record<string, unknown>,
      output,
      timestamp: new Date().toISOString(),
      sequenceNumber: toolLogs.length + 1,
    });
  }

  private collectIssues(
    claim: ClaimInput,
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult,
    medicalNecessity: CheckMedicalNecessityResult,
    benefit: CalculateBenefitResult
  ): Issue[] {
    const issueCollector = new IssueCollector();
    const requiredDocs = this.getRequiredDocuments(policy, claim.claimType);

    issueCollector.collectDocumentIssues(documents, requiredDocs);
    issueCollector.collectPolicyIssues(policy, claim);
    issueCollector.collectMedicalIssues(medicalNecessity);
    issueCollector.collectBenefitIssues(benefit, claim, policy);

    const issues = issueCollector.getIssues();

    for (const document of documents) {
      if (document.completeness === 'type_mismatch') {
        const alreadyCaptured = issues.some(
          issue => issue.type === 'DOCUMENT_TYPE_MISMATCH' && issue.relatedDocument === document.documentId
        );

        if (!alreadyCaptured) {
          const expectedType = requiredDocs[0] ?? 'required document';
          issues.push({
            type: 'DOCUMENT_TYPE_MISMATCH',
            message: `Document '${document.documentType}' does not match expected '${expectedType}'`,
            relatedDocument: document.documentId,
          });
        }
      }
    }

    return issues;
  }

  private buildReport(
    claim: ClaimInput,
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult,
    medicalNecessity: CheckMedicalNecessityResult,
    benefit: CalculateBenefitResult,
    issues: Issue[],
    recommendation: Recommendation,
    toolLogs: ToolCallLogEntry[]
  ): ClaimAssessmentReport {
    return {
      claimId: claim.claimId,
      assessmentDate: new Date().toISOString(),
      documentReview: this.buildDocumentReview(claim, documents, policy),
      policyVerification: this.buildPolicyVerification(claim, policy, issues),
      medicalNecessity: this.buildMedicalNecessity(medicalNecessity),
      benefitCalculation: this.buildBenefitCalculation(benefit),
      recommendation,
      policyCitations: this.buildPolicyCitations(claim, policy, issues),
      toolCallLog: toolLogs,
    };
  }

  private buildDocumentReview(
    claim: ClaimInput,
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult
  ): DocumentReview {
    const requiredDocs = this.getRequiredDocuments(policy, claim.claimType);
    const entries: DocumentReviewEntry[] = [];
    const addedDocumentIds = new Set<string>();

    for (const requiredDoc of requiredDocs) {
      const matchingDocument = documents.find(
        document => document.documentType === requiredDoc && document.completeness !== 'missing'
      );

      if (matchingDocument) {
        entries.push({
          documentId: matchingDocument.documentId,
          documentType: matchingDocument.documentType,
          status: matchingDocument.completeness,
          issues: [...matchingDocument.issues],
          isRequired: true,
        });
        addedDocumentIds.add(matchingDocument.documentId);
      } else {
        entries.push({
          documentId: '',
          documentType: requiredDoc,
          status: 'missing',
          issues: ['Document not submitted'],
          isRequired: true,
        });
      }
    }

    for (const document of documents) {
      if (addedDocumentIds.has(document.documentId)) {
        continue;
      }

      const isRequiredType = requiredDocs.includes(document.documentType);
      const isMissingDocument = document.completeness === 'missing';
      const isWrongType = requiredDocs.length > 0 && !isRequiredType && !isMissingDocument;

      entries.push({
        documentId: document.documentId,
        documentType: document.documentType,
        status: isWrongType ? 'type_mismatch' : document.completeness,
        issues: isWrongType
          ? [`Document type '${document.documentType}' does not match required document types: ${requiredDocs.join(', ')}`]
          : [...document.issues],
        isRequired: false,
      });
    }

    const allRequiredDocumentsPresent = requiredDocs.every(requiredDoc =>
      documents.some(
        document => document.documentType === requiredDoc && document.completeness === 'complete'
      )
    );

    return {
      summary: `${documents.length} documents submitted, ${requiredDocs.length} required for ${claim.claimType}`,
      documents: entries,
      allRequiredDocumentsPresent,
    };
  }

  private buildPolicyVerification(
    claim: ClaimInput,
    policy: LookupPolicyResult,
    issues: Issue[]
  ): PolicyVerification {
    const coverage = this.findCoverage(policy, claim.claimType);
    const treatmentDate = claim.treatmentDate ? new Date(claim.treatmentDate) : undefined;
    const startDate = new Date(policy.policyStartDate);
    const endDate = new Date(policy.policyEndDate);
    const coveragePeriodValid = treatmentDate === undefined || (treatmentDate >= startDate && treatmentDate <= endDate);
    const coveragePeriodDetails = claim.treatmentDate
      ? `Policy active ${policy.policyStartDate} to ${policy.policyEndDate}, treatment date ${claim.treatmentDate} is ${coveragePeriodValid ? 'within' : 'outside'} coverage period`
      : 'Treatment date not provided; coverage period validation skipped';
    const policyIssueTypes = new Set([
      'POLICY_INACTIVE',
      'POLICY_SUSPENDED',
      'COVERAGE_PERIOD_INVALID',
      'CLAIM_TYPE_NOT_COVERED',
      'WAITING_PERIOD_NOT_SATISFIED',
      'POLICY_EXCLUSION_APPLIES',
    ]);

    return {
      policyId: policy.policyId,
      memberName: policy.memberName,
      policyStatus: policy.policyStatus,
      claimTypeIsCovered: coverage?.isCovered ?? false,
      coveragePeriodValid,
      coveragePeriodDetails,
      benefitLimit: coverage?.benefitLimit ?? 0,
      copay: coverage?.copay ?? 0,
      issues: issues
        .filter(issue => policyIssueTypes.has(issue.type))
        .map(issue => issue.message),
    };
  }

  private buildMedicalNecessity(medicalNecessity: CheckMedicalNecessityResult): ClaimAssessmentReport['medicalNecessity'] {
    return {
      diagnosis: medicalNecessity.diagnosis,
      procedures: [...medicalNecessity.procedures],
      isClinicallySuitable: medicalNecessity.isClinicallySuitable,
      reasoning: medicalNecessity.reasoning,
      confidenceScore: medicalNecessity.confidenceScore,
      issues: this.buildMedicalIssues(medicalNecessity),
    };
  }

  private buildBenefitCalculation(benefit: CalculateBenefitResult): ClaimAssessmentReport['benefitCalculation'] {
    const coveredAmount = Math.min(benefit.coveredAmount, benefit.benefitLimit);
    const memberResponsibility = Math.max(
      0,
      benefit.submittedAmount - coveredAmount + benefit.copay + benefit.deductibleApplied
    );
    const insuranceResponsibility = Math.max(0, coveredAmount - benefit.copay);
    const remainingBenefitLimit = Math.max(0, benefit.benefitLimit - coveredAmount);

    return {
      submittedAmount: benefit.submittedAmount,
      benefitLimit: benefit.benefitLimit,
      coveredAmount,
      copay: benefit.copay,
      deductible: benefit.deductibleApplied,
      memberResponsibility,
      insuranceResponsibility,
      remainingBenefitLimit,
      details: benefit.details,
    };
  }

  private buildPolicyCitations(
    claim: ClaimInput,
    policy: LookupPolicyResult,
    issues: Issue[]
  ): PolicyCitation[] {
    if (issues.length === 0) {
      return this.buildPositivePolicyCitations(claim, policy);
    }

    const citations: PolicyCitation[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'DOCUMENT_MISSING':
        case 'DOCUMENT_INCOMPLETE':
        case 'DOCUMENT_TYPE_MISMATCH':
          citations.push({
            clause: 'Required Documents',
            clauseName: 'Required Documentation Standards',
            citedText: this.getRequiredDocuments(policy, claim.claimType).join(', '),
            applicationToThisClaim: issue.message,
          });
          break;
        case 'POLICY_INACTIVE':
        case 'POLICY_SUSPENDED':
          citations.push({
            clause: policy.policyStatus,
            clauseName: 'Policy Status Requirements',
            citedText: `Policy status: ${policy.policyStatus}`,
            applicationToThisClaim: issue.message,
          });
          break;
        case 'COVERAGE_PERIOD_INVALID':
          citations.push({
            clause: 'Coverage Period',
            clauseName: 'Coverage Period Requirements',
            citedText: `Policy active ${policy.policyStartDate} to ${policy.policyEndDate}`,
            applicationToThisClaim: issue.message,
          });
          break;
        case 'CLAIM_TYPE_NOT_COVERED': {
          const coverage = this.findCoverage(policy, claim.claimType);
          citations.push({
            clause: claim.claimType,
            clauseName: 'Coverage Inclusions Clause',
            citedText: coverage?.description ?? 'No coverage inclusion found for this claim type',
            applicationToThisClaim: issue.message,
          });
          break;
        }
        case 'WAITING_PERIOD_NOT_SATISFIED': {
          const coverage = this.findCoverage(policy, claim.claimType);
          citations.push({
            clause: `Waiting Period ${claim.claimType}`,
            clauseName: 'Waiting Period Requirements',
            citedText: `${coverage?.waitingPeriod ?? 0} day waiting period for ${claim.claimType}`,
            applicationToThisClaim: issue.message,
          });
          break;
        }
        case 'MEDICAL_NOT_APPROPRIATE':
        case 'MEDICAL_LOW_CONFIDENCE':
          citations.push({
            clause: 'Medical Necessity',
            clauseName: 'Medical Necessity Standards',
            citedText: 'Medical necessity review result',
            applicationToThisClaim: issue.message,
          });
          break;
        case 'POLICY_EXCLUSION_APPLIES': {
          const exclusion = this.findExclusion(policy, claim.claimType);
          citations.push({
            clause: `Exclusion Clause ${exclusion?.policyClause ?? 'N/A'}`,
            clauseName: 'Exclusions Clause',
            citedText: exclusion?.description ?? 'Treatment falls under policy exclusion',
            applicationToThisClaim: issue.message,
          });
          break;
        }
        case 'BENEFIT_LIMIT_EXCEEDED': {
          const coverage = this.findCoverage(policy, claim.claimType);
          citations.push({
            clause: `Benefit Limit ${claim.claimType}`,
            clauseName: 'Benefit Limit Clause',
            citedText: `Benefit limit: ${coverage?.benefitLimit ?? 0}`,
            applicationToThisClaim: issue.message,
          });
          break;
        }
      }
    }

    return citations;
  }

  private buildPositivePolicyCitations(claim: ClaimInput, policy: LookupPolicyResult): PolicyCitation[] {
    const coverage = this.findCoverage(policy, claim.claimType);
    const requiredDocuments = this.getRequiredDocuments(policy, claim.claimType);
    const citations: PolicyCitation[] = [];

    if (coverage) {
      citations.push({
        clause: claim.claimType,
        clauseName: 'Coverage Inclusions Clause',
        citedText: coverage.description,
        applicationToThisClaim: `${claim.claimType} is covered with benefit limit ${coverage.benefitLimit}`,
      });
    }

    if (requiredDocuments.length > 0) {
      citations.push({
        clause: 'Required Documents',
        clauseName: 'Required Documentation Standards',
        citedText: requiredDocuments.join(', '),
        applicationToThisClaim: 'All required documents were submitted and complete',
      });
    }

    return citations;
  }

  private buildMedicalIssues(medicalNecessity: CheckMedicalNecessityResult): string[] {
    if (!medicalNecessity.isClinicallySuitable) {
      return [`Treatment not appropriate: ${medicalNecessity.reasoning}`];
    }

    if (medicalNecessity.confidenceScore < 0.7) {
      return [`Low confidence score: ${medicalNecessity.confidenceScore}`];
    }

    return [];
  }

  private getRequiredDocuments(policy: LookupPolicyResult, claimType: string): string[] {
    return policy.requiredDocuments
      .find((requiredDocument: RequiredDocumentResult) => requiredDocument.claimType === claimType)
      ?.requiredDocs ?? [];
  }

  private findCoverage(policy: LookupPolicyResult, claimType: string): CoverageInclusionResult | undefined {
    return policy.coverageInclusions.find(
      (coverage: CoverageInclusionResult) => coverage.claimType === claimType
    );
  }

  private findExclusion(policy: LookupPolicyResult, claimType: string): ExclusionResult | undefined {
    return policy.exclusions.find((exclusion: ExclusionResult) =>
      exclusion.exclusionType.toLowerCase().includes(claimType.toLowerCase()) ||
      claimType.toLowerCase().includes(exclusion.exclusionType.toLowerCase())
    );
  }
}
