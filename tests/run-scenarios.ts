import 'dotenv/config';
import { ClaimAgent } from '../src/infrastructure/ai/claim-agent';
import { ClaimInput } from '../src/domain/claim';
import { MockDocumentTool } from '../src/infrastructure/tools/mock-document-tool';
import { MockPolicyTool } from '../src/infrastructure/tools/mock-policy-tool';
import { MockMedicalNecessityTool } from '../src/infrastructure/tools/mock-medical-necessity-tool';
import { MockBenefitTool } from '../src/infrastructure/tools/mock-benefit-tool';
import { DocumentRepository } from '../src/infrastructure/repositories/document-repository';
import { PolicyRepository } from '../src/infrastructure/repositories/policy-repository';
import { approveCase } from './scenarios/approve-case';
import { rejectCase } from './scenarios/reject-case';
import { requestMoreInfoCase } from './scenarios/request-more-info-case';

interface TestResult {
  scenarioName: string;
  expected: string;
  actual: string;
  passed: boolean;
  toolCallSummary: string[];
  reportSections: string[];
}

function validateReportSections(result: { report: any }): string[] {
  const requiredSections = [
    'documentReview',
    'policyVerification',
    'medicalNecessity',
    'benefitCalculation',
    'recommendation',
    'policyCitations',
    'toolCallLog',
  ];

  return requiredSections.filter(section => section in result.report);
}

async function runScenario(
  agent: ClaimAgent,
  scenario: { name: string; claimInput: ClaimInput; expectedDecision: string }
): Promise<TestResult> {
  const result = await agent.assess(scenario.claimInput);
  const actualDecision = result.report.recommendation.decision;
  const passed = actualDecision === scenario.expectedDecision;

  const toolCallSummary = result.toolLogs.map(log => `${log.sequenceNumber}. ${log.toolName}`);
  const reportSections = validateReportSections(result);

  return {
    scenarioName: scenario.name,
    expected: scenario.expectedDecision,
    actual: actualDecision,
    passed,
    toolCallSummary,
    reportSections,
  };
}

async function main() {
  const apiKeyDetected = process.env.GROQ_API_KEY ? 'YES' : 'NO';
  console.log(`Groq API key detected? ${apiKeyDetected}`);

  const documentRepository = new DocumentRepository();
  const policyRepository = new PolicyRepository();

  const documentTool = new MockDocumentTool(documentRepository);
  const policyTool = new MockPolicyTool(policyRepository);
  const medicalNecessityTool = new MockMedicalNecessityTool();
  const benefitTool = new MockBenefitTool(policyRepository);

  const agent = new ClaimAgent(
    documentTool,
    policyTool,
    medicalNecessityTool,
    benefitTool
  );

  const scenarios = [approveCase, rejectCase, requestMoreInfoCase];
  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    console.log(`Running scenario: ${scenario.name}`);
    const result = await runScenario(agent, scenario);
    results.push(result);
    console.log(`Expected: ${result.expected}`);
    console.log(`Actual: ${result.actual}`);
    console.log(result.passed ? 'PASS' : 'FAIL');
    console.log('');
    console.log('Tools called:');
    result.toolCallSummary.forEach(call => console.log(call));
    console.log('');
    console.log('Report sections present:');
    result.reportSections.forEach(section => console.log(`- ${section}`));
    console.log('');
    console.log('---');
    console.log('');
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`Summary: ${passedCount}/${results.length} scenarios passed`);
}

main().catch(error => {
  console.error('Test run failed:', error);
  process.exit(1);
});