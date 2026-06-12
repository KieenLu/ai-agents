import { Document } from '../../domain/document';

export const mockDocuments: Document[] = [
  {
    documentId: 'DOC-001',
    documentType: 'medical_receipt',
    submittedDate: '2026-06-10',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-002',
    documentType: 'discharge_summary',
    submittedDate: '2026-06-10',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-003',
    documentType: 'doctor_note',
    submittedDate: '2026-06-10',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-101',
    documentType: 'medical_receipt',
    submittedDate: '2026-03-15',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-102',
    documentType: 'procedure_report',
    submittedDate: '2026-03-15',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-201',
    documentType: 'medical_receipt',
    submittedDate: '2026-05-15',
    completeness: 'complete',
    issues: [],
  },
  {
    documentId: 'DOC-202',
    documentType: 'prescription',
    submittedDate: '2026-05-15',
    completeness: 'complete',
    issues: [],
  },
];