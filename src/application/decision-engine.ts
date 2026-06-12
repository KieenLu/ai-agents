import { Issue } from './types/issues';
import { Decision, Recommendation, PolicyCitation } from '../domain/report';

export class DecisionEngine {
  private readonly documentPriority = 1;
  private readonly policyStatusPriority = 2;
  private readonly coveragePriority = 3;
  private readonly medicalPriority = 4;
  private readonly exclusionPriority = 5;
  private readonly benefitPriority = 6;

  makeDecision(issues: Issue[]): Recommendation {
    const primaryIssue = this.findPrimaryIssue(issues);
    
    const secondaryIssues = issues.filter(i => i !== primaryIssue);
    
    const primaryReason = primaryIssue?.message ?? 'All checks passed';
    const secondaryReasons = secondaryIssues.map(i => i.message);
    
    const decision = this.determineDecision(primaryIssue);
    const actionItems = this.generateActionItems(decision, issues);

    return {
      decision,
      primaryReason,
      secondaryReasons,
      actionItems,
    };
  }

  private findPrimaryIssue(issues: Issue[]): Issue | null {
    if (issues.length === 0) {
      return null;
    }

    return issues.reduce((primary, current) => {
      return this.getPriority(current) < this.getPriority(primary) ? current : primary;
    });
  }

  private getPriority(issue: Issue): number {
    const type = issue.type;
    
    switch (type) {
      case 'DOCUMENT_MISSING':
      case 'DOCUMENT_INCOMPLETE':
      case 'DOCUMENT_TYPE_MISMATCH':
        return this.documentPriority;
      case 'POLICY_INACTIVE':
      case 'POLICY_SUSPENDED':
        return this.policyStatusPriority;
      case 'COVERAGE_PERIOD_INVALID':
      case 'CLAIM_TYPE_NOT_COVERED':
      case 'WAITING_PERIOD_NOT_SATISFIED':
        return this.coveragePriority;
      case 'MEDICAL_LOW_CONFIDENCE':
        return this.medicalPriority;
      case 'MEDICAL_NOT_APPROPRIATE':
        return this.medicalPriority + 1;
      case 'POLICY_EXCLUSION_APPLIES':
        return this.exclusionPriority;
      case 'BENEFIT_LIMIT_EXCEEDED':
        return this.benefitPriority;
      default:
        return 99;
    }
  }

  private determineDecision(primaryIssue: Issue | null): Decision {
    if (primaryIssue === null) {
      return 'APPROVE';
    }

    const type = primaryIssue.type;

    switch (type) {
      case 'DOCUMENT_MISSING':
      case 'DOCUMENT_INCOMPLETE':
      case 'DOCUMENT_TYPE_MISMATCH':
        return 'REQUEST_MORE_INFO';
      case 'POLICY_INACTIVE':
      case 'POLICY_SUSPENDED':
      case 'COVERAGE_PERIOD_INVALID':
      case 'CLAIM_TYPE_NOT_COVERED':
      case 'WAITING_PERIOD_NOT_SATISFIED':
      case 'MEDICAL_NOT_APPROPRIATE':
      case 'POLICY_EXCLUSION_APPLIES':
        return 'REJECT';
      case 'MEDICAL_LOW_CONFIDENCE':
        return 'REQUEST_MORE_INFO';
      case 'BENEFIT_LIMIT_EXCEEDED':
        return 'APPROVE';
      default:
        return 'REQUEST_MORE_INFO';
    }
  }

  private generateActionItems(decision: Decision, issues: Issue[]): string[] {
    if (decision === 'REQUEST_MORE_INFO') {
      return issues
        .filter(i => i.type.startsWith('DOCUMENT_'))
        .map(i => `Please provide: ${i.message}`);
    }

    if (decision === 'REJECT') {
      return issues
        .filter(i => i.type !== 'DOCUMENT_MISSING' && i.type !== 'DOCUMENT_INCOMPLETE')
        .map(i => i.message);
    }

    return ['No additional information required'];
  }

  generateCitations(
    issues: Issue[],
    _claimId: string
  ): PolicyCitation[] {
    return issues.map(issue => ({
      clause: issue.policyClause ?? 'N/A',
      clauseName: this.getClauseName(issue.type),
      citedText: this.getCitedText(issue),
      applicationToThisClaim: issue.message,
    }));
  }

  private getClauseName(issueType: Issue['type']): string {
    const clauseNames: Record<string, string> = {
      DOCUMENT_MISSING: 'Required Documentation Standards',
      DOCUMENT_INCOMPLETE: 'Documentation Completeness Requirements',
      DOCUMENT_TYPE_MISMATCH: 'Document Type Specifications',
      POLICY_INACTIVE: 'Policy Status Requirements',
      POLICY_SUSPENDED: 'Policy Status Requirements',
      COVERAGE_PERIOD_INVALID: 'Coverage Period Requirements',
      CLAIM_TYPE_NOT_COVERED: 'Coverage Inclusions Clause',
      WAITING_PERIOD_NOT_SATISFIED: 'Waiting Period Requirements',
      MEDICAL_NOT_APPROPRIATE: 'Medical Necessity Standards',
      MEDICAL_LOW_CONFIDENCE: 'Medical Necessity Review Process',
      POLICY_EXCLUSION_APPLIES: 'Exclusions Clause',
      BENEFIT_LIMIT_EXCEEDED: 'Benefit Limit Clause',
    };

    return clauseNames[issueType] ?? 'Policy Rule';
  }

  private getCitedText(issue: Issue): string {
    return issue.policyClause ?? `As per policy terms: ${issue.message}`;
  }
}