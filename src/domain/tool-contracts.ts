import {
  VerifyDocumentInput,
  VerifyDocumentResult,
  LookupPolicyInput,
  LookupPolicyResult,
  CheckMedicalNecessityInput,
  CheckMedicalNecessityResult,
  CalculateBenefitInput,
  CalculateBenefitResult,
} from './tool-inputs';

export interface Tool<TInput, TResult> {
  execute(input: TInput): Promise<TResult>;
}

export interface AiToolDefinition<TInput = Record<string, unknown>, TResult = unknown> {
  description: string;
  parameters: Record<string, unknown>;
  execute(input: TInput): Promise<TResult>;
}

export interface ClaimAssessmentTools {
  verifyDocument: Tool<VerifyDocumentInput, VerifyDocumentResult>;
  lookupPolicy: Tool<LookupPolicyInput, LookupPolicyResult>;
  checkMedicalNecessity: Tool<CheckMedicalNecessityInput, CheckMedicalNecessityResult>;
  calculateBenefit: Tool<CalculateBenefitInput, CalculateBenefitResult>;
}
