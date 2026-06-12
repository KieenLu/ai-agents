import { Tool } from '../../domain/tool-contracts';
import { VerifyDocumentInput, VerifyDocumentResult } from '../../domain/tool-inputs';
import { DocumentRepository } from '../repositories/document-repository';

export class MockDocumentTool implements Tool<VerifyDocumentInput, VerifyDocumentResult> {
  constructor(private repository: DocumentRepository) {}

  async execute(input: VerifyDocumentInput): Promise<VerifyDocumentResult> {
    let document;
    try {
      document = this.repository.findById(input.documentId);
    } catch {
      return {
        documentId: input.documentId,
        documentType: 'unknown',
        completeness: 'missing',
        issues: ['Document not found in system'],
        submittedDate: '',
      };
    }

    return {
      documentId: document.documentId,
      documentType: document.documentType,
      completeness: document.completeness,
      issues: [...document.issues],
      submittedDate: document.submittedDate,
    };
  }
}