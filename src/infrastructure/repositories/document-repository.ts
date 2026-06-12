import { Document } from '../../domain/document';
import { mockDocuments } from '../mock-data/documents';

export class DocumentNotFoundError extends Error {
  constructor(public readonly documentId: string) {
    super(`Document not found: ${documentId}`);
    this.name = 'DocumentNotFoundError';
  }
}

export class DocumentRepository {
  private documents: Map<string, Document> = new Map(mockDocuments.map(d => [d.documentId, d]));

  findById(documentId: string): Document {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new DocumentNotFoundError(documentId);
    }
    return { ...document };
  }

  exists(documentId: string): boolean {
    return this.documents.has(documentId);
  }

  findLastIncomplete(): Document | undefined {
    return mockDocuments.find(d => d.completeness === 'incomplete');
  }
}