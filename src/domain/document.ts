export interface Document {
  documentId: string;
  documentType: string;
  submittedDate: string;
  completeness: 'complete' | 'incomplete' | 'missing' | 'type_mismatch';
  issues: string[];
}