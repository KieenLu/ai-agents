import { ClaimInput, ClaimAssessmentReport } from '../domain';
import { ClaimAssessmentTools } from '../domain/tool-contracts';
import { VerifyDocumentResult, LookupPolicyResult, CheckMedicalNecessityResult, CalculateBenefitResult } from '../domain/tool-inputs';
import { IssueCollector } from './issue-collector';
import { ReportGenerator } from './report-generator';
import { ToolLogger } from './tool-logger';
import { Result, success, error } from '../shared/result';

export class AssessClaimUseCase {
  constructor(
    private tools: ClaimAssessmentTools,
    private issueCollector: IssueCollector,
    private reportGenerator: ReportGenerator,
    private toolLogger: ToolLogger
  ) {}

  async execute(claim: ClaimInput): Promise<Result<ClaimAssessmentReport>> {
    this.toolLogger.clear();
    this.issueCollector.clear();

    try {
      const documentResults = await this.verifyAllDocuments(claim.submittedDocuments);

      const policy = await this.lookupPolicy(claim.policyId);

      const medicalNecessity = await this.checkMedicalNecessity(
        claim.diagnosis,
        claim.procedures
      );

      const benefit = await this.calculateBenefit(
        claim.policyId,
        claim.claimType,
        claim.amount
      );

      this.collectAllIssues(
        documentResults,
        policy,
        medicalNecessity,
        benefit,
        claim
      );

      const report = this.reportGenerator.generate(
        claim,
        documentResults,
        policy,
        medicalNecessity,
        benefit,
        this.issueCollector.getIssues(),
        this.toolLogger.getLogs()
      );

      return success(report);
    } catch (err) {
      return error(
        `Claim assessment failed: ${err instanceof Error ? err.message : String(err)}`,
        'ASSESSMENT_ERROR'
      );
    }
  }

  private async verifyAllDocuments(
    documentIds: string[]
  ): Promise<VerifyDocumentResult[]> {
    const results: VerifyDocumentResult[] = [];

    for (const docId of documentIds) {
      const doc = await this.executeVerifyDocument(docId);
      results.push(doc);
    }

    return results;
  }

  private async executeVerifyDocument(
    documentId: string
  ): Promise<VerifyDocumentResult> {
    const input = { documentId };

    const result = await this.tools.verifyDocument.execute(input);

    this.toolLogger.log('verifyDocument', input, result);

    return result;
  }

  private async lookupPolicy(
    policyId: string
  ): Promise<LookupPolicyResult> {
    const input = { policyId };

    const result = await this.tools.lookupPolicy.execute(input);

    this.toolLogger.log('lookupPolicy', input, result);

    return result;
  }

  private async checkMedicalNecessity(
    diagnosis: string,
    procedures: string[]
  ): Promise<CheckMedicalNecessityResult> {
    const input = { diagnosis, procedures };

    const result = await this.tools.checkMedicalNecessity.execute(input);

    this.toolLogger.log('checkMedicalNecessity', input, result);

    return result;
  }

  private async calculateBenefit(
    policyId: string,
    claimType: string,
    amount: number
  ): Promise<CalculateBenefitResult> {
    const input = { policyId, claimType, amount };

    const result = await this.tools.calculateBenefit.execute(input);

    this.toolLogger.log('calculateBenefit', input, result);

    return result;
  }

  private collectAllIssues(
    documents: VerifyDocumentResult[],
    policy: LookupPolicyResult,
    medicalNecessity: CheckMedicalNecessityResult,
    benefit: CalculateBenefitResult,
    claim: ClaimInput
  ): void {
    const requiredDocTypes = policy.requiredDocuments
      .find(rd => rd.claimType === claim.claimType)?.requiredDocs ?? [];

    this.issueCollector.collectDocumentIssues(documents, requiredDocTypes);
    this.issueCollector.collectPolicyIssues(policy, claim);
    this.issueCollector.collectMedicalIssues(medicalNecessity);
    this.issueCollector.collectBenefitIssues(benefit, claim, policy);
  }
}