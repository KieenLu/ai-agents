import { Tool } from '../../domain/tool-contracts';
import { CheckMedicalNecessityInput, CheckMedicalNecessityResult } from '../../domain/tool-inputs';

interface MedicalRule {
  conditionKeywords: string[];
  procedureKeywords: string[];
  suitable: boolean;
  reasoning: string;
  confidence: number;
}

const medicalRules: MedicalRule[] = [
  {
    conditionKeywords: ['fractured tibia', 'tibia fracture', 'fracture', 'fractured'],
    procedureKeywords: ['orthopedic surgery', 'surgery', 'cast application', 'cast', 'x-ray'],
    suitable: true,
    reasoning: 'Orthopedic surgery, casting, and imaging are standard treatment and stabilization for fractures.',
    confidence: 0.95,
  },
  {
    conditionKeywords: ['appendectomy', 'appendicitis', 'appendix'],
    procedureKeywords: ['appendectomy', 'appendix removal', 'laparoscopic surgery', 'surgery'],
    suitable: true,
    reasoning: 'Appendectomy is the standard surgical treatment for appendicitis or appendix-related conditions',
    confidence: 0.95,
  },
  {
    conditionKeywords: ['type 2 diabetes', 'diabetes'],
    procedureKeywords: ['blood glucose test', 'hba1c', 'insulin therapy', 'insulin'],
    suitable: true,
    reasoning: 'Laboratory tests are standard monitoring for diabetes management. Insulin therapy is appropriate when clinically indicated.',
    confidence: 0.92,
  },
  {
    conditionKeywords: ['rhinoplasty', 'cosmetic surgery', 'cosmetic', 'aesthetic'],
    procedureKeywords: ['cosmetic surgery', 'rhinoplasty', 'nose reshaping', 'breast augmentation', 'liposuction'],
    suitable: false,
    reasoning: 'Cosmetic-only procedures are elective and not medically necessary without documented functional impairment.',
    confidence: 0.95,
  },
  {
    conditionKeywords: ['common cold', 'cold'],
    procedureKeywords: ['cosmetic surgery', 'rhinoplasty', 'breast augmentation', 'liposuction'],
    suitable: false,
    reasoning: 'Cosmetic surgery has no clinical relationship to common cold treatment.',
    confidence: 0.99,
  },
];

const cosmeticProcedureKeywords = ['cosmetic surgery', 'rhinoplasty', 'nose reshaping', 'breast augmentation', 'liposuction'];

export class MockMedicalNecessityTool implements Tool<CheckMedicalNecessityInput, CheckMedicalNecessityResult> {
  async execute(input: CheckMedicalNecessityInput): Promise<CheckMedicalNecessityResult> {
    const diagnosis = this.normalize(input.diagnosis);
    const procedures = input.procedures.map(procedure => this.normalize(procedure));
    const procedureText = procedures.join(' ');

    const cosmeticMatch = this.findRuleMatch(diagnosis, procedures, procedureText, cosmeticProcedureKeywords);
    if (cosmeticMatch && this.isCosmeticOnlyCase(diagnosis, procedureText)) {
      return this.toResult(input, false, 'Cosmetic-only procedures are elective and not medically necessary without documented functional impairment.', 0.95);
    }

    const rule = this.findMatchingRule(diagnosis, procedures, procedureText);
    if (rule) {
      return this.toResult(input, rule.suitable, rule.reasoning, rule.confidence);
    }

    const hasKnownProcedure = procedures.some(procedure =>
      medicalRules.some(rule => rule.procedureKeywords.some(keyword => procedure.includes(keyword)))
    );

    if (hasKnownProcedure) {
      const procedureRule = medicalRules.find(rule =>
        rule.procedureKeywords.some(keyword => procedureText.includes(keyword))
      );

      if (procedureRule) {
        return this.toResult(input, procedureRule.suitable, `Procedure-based assessment: ${procedureRule.reasoning}`, procedureRule.confidence);
      }
    }

    return this.toResult(
      input,
      false,
      'Unable to determine medical appropriateness - condition/procedure combination not found in standard mappings',
      0.3
    );
  }

  private findMatchingRule(
    diagnosis: string,
    procedures: string[],
    procedureText: string
  ): MedicalRule | undefined {
    return medicalRules.find(rule => {
      const diagnosisMatches = rule.conditionKeywords.some(keyword => diagnosis.includes(keyword));
      const procedureMatches = procedures.some(procedure =>
        rule.procedureKeywords.some(keyword => procedure.includes(keyword))
      ) || procedureText.split(' ').some(token => rule.procedureKeywords.some(keyword => keyword.includes(token) && token.length > 3));

      return diagnosisMatches && procedureMatches;
    });
  }

  private findRuleMatch(
    diagnosis: string,
    procedures: string[],
    procedureText: string,
    procedureKeywords: string[]
  ): boolean {
    const diagnosisMatches = ['cosmetic', 'aesthetic', 'rhinoplasty'].some(keyword => diagnosis.includes(keyword));
    const procedureMatches = procedures.some(procedure =>
      procedureKeywords.some(keyword => procedure.includes(keyword))
    ) || procedureText.includes('cosmetic') || procedureText.includes('rhinoplasty');

    return diagnosisMatches && procedureMatches;
  }

  private isCosmeticOnlyCase(diagnosis: string, procedureText: string): boolean {
    const functionalKeywords = ['functional impairment', 'breathing', 'trauma', 'reconstructive', 'cancer', 'pain'];
    const hasFunctionalReason = functionalKeywords.some(keyword => diagnosis.includes(keyword) || procedureText.includes(keyword));

    return !hasFunctionalReason;
  }

  private toResult(
    input: CheckMedicalNecessityInput,
    isClinicallySuitable: boolean,
    reasoning: string,
    confidenceScore: number
  ): CheckMedicalNecessityResult {
    return {
      diagnosis: input.diagnosis,
      procedures: [...input.procedures],
      isClinicallySuitable,
      reasoning,
      confidenceScore,
    };
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
