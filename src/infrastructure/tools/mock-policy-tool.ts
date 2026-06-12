import { Tool } from '../../domain/tool-contracts';
import { LookupPolicyInput, LookupPolicyResult } from '../../domain/tool-inputs';
import { PolicyRepository } from '../repositories/policy-repository';

export class MockPolicyTool implements Tool<LookupPolicyInput, LookupPolicyResult> {
  constructor(private repository: PolicyRepository) {}

  async execute(input: LookupPolicyInput): Promise<LookupPolicyResult> {
    const policy = this.repository.findById(input.policyId);
    
    return {
      policyId: policy.policyId,
      memberName: policy.memberName,
      memberId: policy.memberId,
      policyType: policy.policyType,
      policyStartDate: policy.policyStartDate,
      policyEndDate: policy.policyEndDate,
      policyStatus: policy.policyStatus,
      coverageInclusions: [...policy.coverageInclusions],
      exclusions: [...policy.exclusions],
      requiredDocuments: [...policy.requiredDocuments],
    };
  }
}