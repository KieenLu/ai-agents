import { Tool } from '../../domain/tool-contracts';
import { CalculateBenefitInput, CalculateBenefitResult } from '../../domain/tool-inputs';
import { PolicyRepository } from '../repositories/policy-repository';

export class MockBenefitTool implements Tool<CalculateBenefitInput, CalculateBenefitResult> {
  constructor(private repository: PolicyRepository) {}

  async execute(input: CalculateBenefitInput): Promise<CalculateBenefitResult> {
    const policy = this.repository.findById(input.policyId);
    
    const coverage = policy.coverageInclusions.find(
      (c: { claimType: string; benefitLimit: number; copay: number; deductible: number }) => c.claimType === input.claimType
    );

    if (!coverage) {
      return {
        policyId: input.policyId,
        claimType: input.claimType,
        submittedAmount: input.amount,
        benefitLimit: 0,
        copay: 0,
        deductibleApplied: 0,
        coveredAmount: 0,
        memberResponsibility: input.amount,
        remainingBenefitLimit: 0,
        details: `Claim type '${input.claimType}' is not covered under this policy - no benefit available`,
      };
    }

    const coveredAmount = Math.min(input.amount, coverage.benefitLimit);
    const memberResponsibility = coverage.copay + coverage.deductible + (input.amount - coveredAmount);
    const remainingBenefitLimit = Math.max(0, coverage.benefitLimit - coveredAmount);

    return {
      policyId: input.policyId,
      claimType: input.claimType,
      submittedAmount: input.amount,
      benefitLimit: coverage.benefitLimit,
      copay: coverage.copay,
      deductibleApplied: coverage.deductible,
      coveredAmount,
      memberResponsibility,
      remainingBenefitLimit,
      details: `Covered $${coveredAmount} of $${input.amount} submitted. Copay: $${coverage.copay}, Deductible: $${coverage.deductible}. Member responsible for $${memberResponsibility}.`,
    };
  }
}