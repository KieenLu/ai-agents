import { Policy } from '../../domain/policy';
import { mockPolicies } from '../mock-data/policies';

export class PolicyNotFoundError extends Error {
  constructor(public readonly policyId: string) {
    super(`Policy not found: ${policyId}`);
    this.name = 'PolicyNotFoundError';
  }
}

export class PolicyRepository {
  private policies: Map<string, Policy> = new Map(mockPolicies.map(p => [p.policyId, p]));

  findById(policyId: string): Policy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new PolicyNotFoundError(policyId);
    }
    return { ...policy };
  }

  exists(policyId: string): boolean {
    return this.policies.has(policyId);
  }
}