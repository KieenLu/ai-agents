import { Document } from '../../domain/document';

export const mockDocuments: Document[] = [
  // APPROVE scenario documents - all complete (treatment date: 2026-06-15)
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
  // REQUEST_MORE_INFO scenario - missing discharge_summary (treatment date: 2026-05-10)
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
  // REJECT scenario - cosmetic surgery (treatment date: 2026-03-20)
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
  // Incomplete document example
  {
    documentId: 'DOC-INC-001',
    documentType: 'lab_results',
    submittedDate: '2026-04-01',
    completeness: 'incomplete',
    issues: ['Missing lab values', 'Missing reference ranges'],
  },
];