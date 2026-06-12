# Claim Assessment AI Agent

AI-powered insurance claim assessment service built with TypeScript, Express, Groq, and a hybrid deterministic + LLM architecture.

The system evaluates insurance claims by combining factual tool outputs with Groq-based reasoning to produce a structured assessment report containing document review, policy verification, medical necessity analysis, benefit calculation, recommendation, policy citations, and full tool call logs.

## 1. Project Overview

This project implements a Claim Assessment AI Agent for the AI Challenge evaluation. It assesses insurance claims against policy rules, submitted documents, medical necessity, and benefit limits.

The current implementation is a **hybrid AI architecture**:

1. **Deterministic tools provide factual data**
   - `verifyDocument`
   - `lookupPolicy`
   - `checkMedicalNecessity`
   - `calculateBenefit`

2. **Groq LLM performs reasoning and final assessment synthesis**
   - Recommendation reasoning
   - Policy citation generation
   - Final report generation

3. **Guardrails validate the final output**
   - Prevents policy hallucination
   - Preserves deterministic decision correctness
   - Enforces benefit limits
   - Preserves traceable tool logs

### Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **API:** Express
- **AI Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`
- **AI SDK:** Vercel AI SDK
- **Architecture:** Clean Architecture
  - Domain
  - Application
  - Infrastructure
  - Presentation API

## 2. Architecture

### High-Level Flow

```text
Input Claim
↓
Document Verification Tool
Policy Lookup Tool
Medical Necessity Tool
Benefit Calculation Tool
↓
Groq LLM Reasoning
↓
Guardrails Validation
↓
Final Assessment Report
```

### Tool Workflow

Every claim follows the required evaluation order:

```text
1. verifyDocument for every submitted document
2. lookupPolicy
3. checkMedicalNecessity
4. calculateBenefit
5. Groq synthesizes final report
6. Guardrails validate and merge final report
```

All 4 tools are invoked for every claim. The tool call log records:

- Tool name
- Input
- Output
- Timestamp
- Sequence number

### Why Hybrid Architecture?

A pure LLM approach can produce fluent but inconsistent answers. A pure rules engine can be correct but less explainable.

This implementation uses a hybrid approach:

| Layer | Purpose |
|---|---|
| Deterministic tools | Provide reliable factual data from mock repositories |
| Groq LLM | Synthesize reasoning, recommendations, and explanations |
| Guardrails | Preserve correctness and challenge constraints |

This keeps the system both **reliable** and **explainable**.

## 3. Project Structure

```text
/src
  /domain
    claim.ts                 - Claim input and domain types
    policy.ts                - Policy domain types
    document.ts              - Document domain types
    tool-inputs.ts           - Tool input/output contracts
    tool-contracts.ts        - Tool interfaces
    report.ts                - Assessment report schema

  /application
    decision-engine.ts       - Deterministic decision rules
    issue-collector.ts       - Issue collection rules
    report-generator.ts      - Application-layer report builder

  /infrastructure
    /ai
      claim-agent.ts         - Hybrid claim agent orchestration
      groq-provider.ts       - Groq model provider
      /tools                 - AI tool wrappers
    /tools
      mock-document-tool.ts
      mock-policy-tool.ts
      mock-medical-necessity-tool.ts
      mock-benefit-tool.ts
    /repositories
      document-repository.ts
      policy-repository.ts
    /data
      documents.ts           - Mock document dataset
      policies.ts            - Mock policy dataset

  /presentation/api
    server.ts                - Express server entry point
    routes/claim-routes.ts   - API route handlers

  /config
    system-prompt.ts         - Agent prompt and challenge rules
```

## 4. Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy the example environment file:

```bash
copy .env.example .env
```

Or manually create `.env`.

### 3. Configure Groq API key

Add your Groq API key:

```env
GROQ_API_KEY=your_key_here
```

**Security note:** Real API keys are excluded from the repository and should be provided separately. The `.env` file should **not** be committed to GitHub.

### 4. Run the project

```bash
npm run dev
```

The API server runs on:

```text
http://localhost:3000
```

### 5. Build

```bash
npm run build
```

### 6. Run scenario tests

```bash
npm run test:scenarios
```

## 5. Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `GROQ_API_KEY` | Yes | Groq API key used by `groq-provider.ts` |

Example `.env`:

```env
GROQ_API_KEY=your_key_here
```

The repository includes `.env.example` for local setup. The actual `.env` file is ignored by Git.

## 6. API Usage

### POST `/api/assess-claim`

Submit a claim for assessment.

**Method:** `POST`

**URL:**

```text
http://localhost:3000/api/assess-claim
```

**Headers:**

```text
Content-Type: application/json
```

**Request body fields:**

| Field | Required | Description |
|---|---:|---|
| `claimId` | Yes | Unique claim identifier |
| `policyId` | Yes | Policy identifier |
| `claimType` | Yes | Claim category |
| `amount` | Yes | Submitted claim amount |
| `diagnosis` | Yes | Patient diagnosis |
| `procedures` | Yes | Procedure list |
| `submittedDocuments` | Yes | Submitted document IDs |
| `treatmentDate` | No | Optional future field. If absent, coverage period validation is skipped. |

**Response sections:**

```json
{
  "claimId": "string",
  "assessmentDate": "ISO date",
  "documentReview": {},
  "policyVerification": {},
  "medicalNecessity": {},
  "benefitCalculation": {},
  "recommendation": {
    "decision": "APPROVE | REJECT | REQUEST_MORE_INFO",
    "primaryReason": "string",
    "secondaryReasons": ["string"],
    "actionItems": ["string"]
  },
  "policyCitations": [],
  "toolCallLog": []
}
```

### GET `/api/health`

Verify server startup.

```bash
curl.exe -s http://localhost:3000/api/health
```

Example response:

```json
{
  "status": "ok",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

The server also exposes:

```text
GET /health
```

## 7. cURL Examples

### Health Check

```bash
curl.exe -s http://localhost:3000/api/health
```

### Claim Assessment

```bash
curl.exe -s -X POST http://localhost:3000/api/assess-claim ^
  -H "Content-Type: application/json" ^
  --data-binary @claim-request.json
```

Example `claim-request.json`:

```json
{
  "claimId": "CLM-APPROVE-001",
  "policyId": "POL-COMPREHENSIVE-001",
  "claimType": "inpatient_hospitalization",
  "amount": 15000,
  "diagnosis": "Fractured tibia",
  "procedures": ["orthopedic surgery"],
  "submittedDocuments": ["DOC-001", "DOC-002", "DOC-003"]
}
```

## 8. Postman Usage

1. Start the server:

   ```bash
   npm run dev
   ```

2. Create a new request.

3. Set method to `POST`.

4. Set URL:

   ```text
   http://localhost:3000/api/assess-claim
   ```

5. Add header:

   ```text
   Content-Type: application/json
   ```

6. Select **Body → raw → JSON**.

7. Paste one of the test case payloads below.

8. Send the request.

9. Inspect the JSON response. The `recommendation.decision` field should match the expected outcome.

## 9. Three Official Test Cases

### Test Case 1: APPROVE_CASE

**Expected outcome:** `APPROVE`

**Input:**

```json
{
  "claimId": "CLM-APPROVE-001",
  "policyId": "POL-COMPREHENSIVE-001",
  "claimType": "inpatient_hospitalization",
  "amount": 15000,
  "diagnosis": "Fractured tibia",
  "procedures": ["orthopedic surgery"],
  "submittedDocuments": ["DOC-001", "DOC-002", "DOC-003"]
}
```

**Result summary:**

- Decision: `APPROVE`
- All required documents are present and complete.
- Policy is active.
- Claim type is covered.
- Medical necessity is satisfied.
- Submitted amount is within benefit limit.

**Result JSON:**

```json
{
  "claimId": "CLM-APPROVE-001",
  "assessmentDate": "2026-06-12T11:16:10.575Z",
  "documentReview": {
    "summary": "3 documents submitted, 3 required for inpatient_hospitalization",
    "documents": [
      {
        "documentId": "DOC-001",
        "documentType": "medical_receipt",
        "status": "complete",
        "issues": [],
        "isRequired": true
      },
      {
        "documentId": "DOC-002",
        "documentType": "discharge_summary",
        "status": "complete",
        "issues": [],
        "isRequired": true
      },
      {
        "documentId": "DOC-003",
        "documentType": "doctor_note",
        "status": "complete",
        "issues": [],
        "isRequired": true
      }
    ],
    "allRequiredDocumentsPresent": true
  },
  "policyVerification": {
    "policyId": "POL-COMPREHENSIVE-001",
    "memberName": "John Smith",
    "policyStatus": "active",
    "claimTypeIsCovered": true,
    "coveragePeriodValid": true,
    "coveragePeriodDetails": "Treatment date not provided; coverage period validation skipped",
    "benefitLimit": 50000,
    "copay": 500,
    "issues": []
  },
  "medicalNecessity": {
    "diagnosis": "Fractured tibia",
    "procedures": ["orthopedic surgery"],
    "isClinicallySuitable": true,
    "reasoning": "Orthopedic surgery, casting, and imaging are standard treatment and stabilization for fractures.",
    "confidenceScore": 0.95,
    "issues": []
  },
  "benefitCalculation": {
    "submittedAmount": 15000,
    "benefitLimit": 50000,
    "coveredAmount": 15000,
    "copay": 500,
    "deductible": 1000,
    "memberResponsibility": 1500,
    "insuranceResponsibility": 14500,
    "remainingBenefitLimit": 35000,
    "details": "Covered $15000 of $15000 submitted. Copay: $500, Deductible: $1000. Member responsible for $1500."
  },
  "recommendation": {
    "decision": "APPROVE",
    "primaryReason": "All checks passed",
    "secondaryReasons": [],
    "actionItems": ["No additional information required"]
  },
  "policyCitations": [
    {
      "clause": "inpatient_hospitalization",
      "clauseName": "Coverage Inclusions Clause",
      "citedText": "Inpatient hospitalization coverage including surgical procedures",
      "applicationToThisClaim": "inpatient_hospitalization is covered with benefit limit 50000"
    },
    {
      "clause": "Required Documents",
      "clauseName": "Required Documentation Standards",
      "citedText": "medical_receipt, discharge_summary, doctor_note",
      "applicationToThisClaim": "All required documents were submitted and complete"
    }
  ],
  "toolCallLog": [
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-001" },
      "output": {
        "documentId": "DOC-001",
        "documentType": "medical_receipt",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-06-10"
      },
      "timestamp": "2026-06-12T11:16:10.572Z",
      "sequenceNumber": 1
    },
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-002" },
      "output": {
        "documentId": "DOC-002",
        "documentType": "discharge_summary",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-06-10"
      },
      "timestamp": "2026-06-12T11:16:10.573Z",
      "sequenceNumber": 2
    },
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-003" },
      "output": {
        "documentId": "DOC-003",
        "documentType": "doctor_note",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-06-10"
      },
      "timestamp": "2026-06-12T11:16:10.573Z",
      "sequenceNumber": 3
    },
    {
      "toolName": "lookupPolicy",
      "input": { "policyId": "POL-COMPREHENSIVE-001" },
      "output": {
        "policyId": "POL-COMPREHENSIVE-001",
        "memberName": "John Smith",
        "memberId": "MEM-001",
        "policyType": "comprehensive",
        "policyStartDate": "2024-01-01",
        "policyEndDate": "2026-12-31",
        "policyStatus": "active",
        "coverageInclusions": [
          {
            "claimType": "inpatient_hospitalization",
            "isCovered": true,
            "benefitLimit": 50000,
            "copay": 500,
            "deductible": 1000,
            "waitingPeriod": 0,
            "description": "Inpatient hospitalization coverage including surgical procedures"
          },
          {
            "claimType": "outpatient_surgery",
            "isCovered": true,
            "benefitLimit": 20000,
            "copay": 300,
            "deductible": 500,
            "waitingPeriod": 0,
            "description": "Outpatient surgical procedures and minor treatments"
          }
        ],
        "exclusions": [
          {
            "exclusionType": "cosmetic_surgery",
            "description": "Cosmetic procedures and treatments for aesthetic enhancement only",
            "policyClause": "4.2"
          }
        ],
        "requiredDocuments": [
          {
            "claimType": "inpatient_hospitalization",
            "requiredDocs": ["medical_receipt", "discharge_summary", "doctor_note"]
          },
          {
            "claimType": "outpatient_surgery",
            "requiredDocs": ["medical_receipt", "discharge_summary"]
          }
        ]
      },
      "timestamp": "2026-06-12T11:16:10.573Z",
      "sequenceNumber": 4
    },
    {
      "toolName": "checkMedicalNecessity",
      "input": {
        "diagnosis": "Fractured tibia",
        "procedures": ["orthopedic surgery"]
      },
      "output": {
        "diagnosis": "Fractured tibia",
        "procedures": ["orthopedic surgery"],
        "isClinicallySuitable": true,
        "reasoning": "Orthopedic surgery, casting, and imaging are standard treatment and stabilization for fractures.",
        "confidenceScore": 0.95
      },
      "timestamp": "2026-06-12T11:16:10.574Z",
      "sequenceNumber": 5
    },
    {
      "toolName": "calculateBenefit",
      "input": {
        "policyId": "POL-COMPREHENSIVE-001",
        "claimType": "inpatient_hospitalization",
        "amount": 15000
      },
      "output": {
        "policyId": "POL-COMPREHENSIVE-001",
        "claimType": "inpatient_hospitalization",
        "submittedAmount": 15000,
        "benefitLimit": 50000,
        "copay": 500,
        "deductibleApplied": 1000,
        "coveredAmount": 15000,
        "memberResponsibility": 1500,
        "remainingBenefitLimit": 35000,
        "details": "Covered $15000 of $15000 submitted. Copay: $500, Deductible: $1000. Member responsible for $1500."
      },
      "timestamp": "2026-06-12T11:16:10.574Z",
      "sequenceNumber": 6
    }
  ]
}
```

---

### Test Case 2: REJECT_CASE

**Expected outcome:** `REJECT`

**Input:**

```json
{
  "claimId": "CLM-REJECT-001",
  "policyId": "POL-STANDARD-001",
  "claimType": "cosmetic_surgery",
  "amount": 8000,
  "diagnosis": "Rhinoplasty for aesthetic enhancement",
  "procedures": ["cosmetic rhinoplasty"],
  "submittedDocuments": ["DOC-101", "DOC-102"]
}
```

**Result summary:**

- Decision: `REJECT`
- Claim type is not covered.
- Exclusion clause `4.2` is triggered.
- Cosmetic surgery is excluded.
- Benefit calculation returns `0`.

**Result JSON:**

```json
{
  "claimId": "CLM-REJECT-001",
  "assessmentDate": "2026-06-12T11:19:45.163Z",
  "documentReview": {
    "summary": "2 documents submitted, 0 required for cosmetic_surgery",
    "documents": [
      {
        "documentId": "DOC-101",
        "documentType": "medical_receipt",
        "status": "complete",
        "issues": [],
        "isRequired": false
      },
      {
        "documentId": "DOC-102",
        "documentType": "procedure_report",
        "status": "complete",
        "issues": [],
        "isRequired": false
      }
    ],
    "allRequiredDocumentsPresent": true
  },
  "policyVerification": {
    "policyId": "POL-STANDARD-001",
    "memberName": "Jane Doe",
    "policyStatus": "active",
    "claimTypeIsCovered": false,
    "coveragePeriodValid": true,
    "coveragePeriodDetails": "Treatment date not provided; coverage period validation skipped",
    "benefitLimit": 0,
    "copay": 0,
    "issues": [
      "Claim type 'cosmetic_surgery' is not covered under this policy",
      "Treatment falls under policy exclusion: Cosmetic procedures are excluded from coverage"
    ]
  },
  "medicalNecessity": {
    "diagnosis": "Rhinoplasty for aesthetic enhancement",
    "procedures": ["cosmetic rhinoplasty"],
    "isClinicallySuitable": false,
    "reasoning": "Cosmetic-only procedures are elective and not medically necessary without documented functional impairment.",
    "confidenceScore": 0.95,
    "issues": [
      "Treatment not appropriate: Cosmetic-only procedures are elective and not medically necessary without documented functional impairment."
    ]
  },
  "benefitCalculation": {
    "submittedAmount": 8000,
    "benefitLimit": 0,
    "coveredAmount": 0,
    "copay": 0,
    "deductible": 0,
    "memberResponsibility": 8000,
    "insuranceResponsibility": 0,
    "remainingBenefitLimit": 0,
    "details": "Claim type 'cosmetic_surgery' is not covered under this policy - no benefit available"
  },
  "recommendation": {
    "decision": "REJECT",
    "primaryReason": "Claim type 'cosmetic_surgery' is not covered under this policy",
    "secondaryReasons": [
      "Treatment falls under policy exclusion: Cosmetic procedures are excluded from coverage",
      "Treatment not clinically appropriate: Cosmetic-only procedures are elective and not medically necessary without documented functional impairment."
    ],
    "actionItems": [
      "Claim type 'cosmetic_surgery' is not covered under this policy",
      "Treatment falls under policy exclusion: Cosmetic procedures are excluded from coverage",
      "Treatment not clinically appropriate: Cosmetic-only procedures are elective and not medically necessary without documented functional impairment."
    ]
  },
  "policyCitations": [
    {
      "clause": "cosmetic_surgery",
      "clauseName": "Coverage Inclusions Clause",
      "citedText": "No coverage inclusion found for this claim type",
      "applicationToThisClaim": "Claim type 'cosmetic_surgery' is not covered under this policy"
    },
    {
      "clause": "Exclusion Clause 4.2",
      "clauseName": "Exclusions Clause",
      "citedText": "Cosmetic procedures are excluded from coverage",
      "applicationToThisClaim": "Treatment falls under policy exclusion: Cosmetic procedures are excluded from coverage"
    },
    {
      "clause": "Medical Necessity",
      "clauseName": "Medical Necessity Standards",
      "citedText": "Medical necessity review result",
      "applicationToThisClaim": "Treatment not clinically appropriate: Cosmetic-only procedures are elective and not medically necessary without documented functional impairment."
    }
  ],
  "toolCallLog": [
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-101" },
      "output": {
        "documentId": "DOC-101",
        "documentType": "medical_receipt",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-03-15"
      },
      "timestamp": "2026-06-12T11:19:45.161Z",
      "sequenceNumber": 1
    },
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-102" },
      "output": {
        "documentId": "DOC-102",
        "documentType": "procedure_report",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-03-15"
      },
      "timestamp": "2026-06-12T11:19:45.161Z",
      "sequenceNumber": 2
    },
    {
      "toolName": "lookupPolicy",
      "input": { "policyId": "POL-STANDARD-001" },
      "output": {
        "policyId": "POL-STANDARD-001",
        "memberName": "Jane Doe",
        "memberId": "MEM-002",
        "policyType": "standard",
        "policyStartDate": "2025-01-01",
        "policyEndDate": "2026-12-31",
        "policyStatus": "active",
        "coverageInclusions": [
          {
            "claimType": "inpatient_hospitalization",
            "isCovered": true,
            "benefitLimit": 30000,
            "copay": 500,
            "deductible": 1000,
            "waitingPeriod": 0,
            "description": "Inpatient hospitalization"
          },
          {
            "claimType": "outpatient_surgery",
            "isCovered": true,
            "benefitLimit": 15000,
            "copay": 250,
            "deductible": 500,
            "waitingPeriod": 0,
            "description": "Outpatient surgical procedures"
          }
        ],
        "exclusions": [
          {
            "exclusionType": "cosmetic_surgery",
            "description": "Cosmetic procedures are excluded from coverage",
            "policyClause": "4.2"
          },
          {
            "exclusionType": "experimental_treatment",
            "description": "Experimental or investigational treatments not yet approved",
            "policyClause": "4.5"
          }
        ],
        "requiredDocuments": [
          {
            "claimType": "inpatient_hospitalization",
            "requiredDocs": ["medical_receipt", "discharge_summary"]
          },
          {
            "claimType": "outpatient_surgery",
            "requiredDocs": ["medical_receipt", "discharge_summary"]
          }
        ]
      },
      "timestamp": "2026-06-12T11:19:45.161Z",
      "sequenceNumber": 3
    },
    {
      "toolName": "checkMedicalNecessity",
      "input": {
        "diagnosis": "Rhinoplasty for aesthetic enhancement",
        "procedures": ["cosmetic rhinoplasty"]
      },
      "output": {
        "diagnosis": "Rhinoplasty for aesthetic enhancement",
        "procedures": ["cosmetic rhinoplasty"],
        "isClinicallySuitable": false,
        "reasoning": "Cosmetic-only procedures are elective and not medically necessary without documented functional impairment.",
        "confidenceScore": 0.95
      },
      "timestamp": "2026-06-12T11:19:45.162Z",
      "sequenceNumber": 4
    },
    {
      "toolName": "calculateBenefit",
      "input": {
        "policyId": "POL-STANDARD-001",
        "claimType": "cosmetic_surgery",
        "amount": 8000
      },
      "output": {
        "policyId": "POL-STANDARD-001",
        "claimType": "cosmetic_surgery",
        "submittedAmount": 8000,
        "benefitLimit": 0,
        "copay": 0,
        "deductibleApplied": 0,
        "coveredAmount": 0,
        "memberResponsibility": 8000,
        "remainingBenefitLimit": 0,
        "details": "Claim type 'cosmetic_surgery' is not covered under this policy - no benefit available"
      },
      "timestamp": "2026-06-12T11:19:45.162Z",
      "sequenceNumber": 5
    }
  ]
}
```

---

### Test Case 3: REQUEST_MORE_INFO_CASE

**Expected outcome:** `REQUEST_MORE_INFO`

**Input:**

```json
{
  "claimId": "CLM-MOREINFO-001",
  "policyId": "POL-BASIC-001",
  "claimType": "outpatient_surgery",
  "amount": 5000,
  "diagnosis": "Appendectomy",
  "procedures": ["appendectomy"],
  "submittedDocuments": ["DOC-201", "DOC-202"]
}
```

**Result summary:**

- Decision: `REQUEST_MORE_INFO`
- `discharge_summary` is missing.
- `DOC-202` is a type mismatch: `prescription` was submitted instead of the required `discharge_summary`.
- The system requests more information instead of rejecting.

**Result JSON:**

```json
{
  "claimId": "CLM-MOREINFO-001",
  "assessmentDate": "2026-06-12T11:20:22.696Z",
  "documentReview": {
    "summary": "2 documents submitted, 2 required for outpatient_surgery",
    "documents": [
      {
        "documentId": "DOC-201",
        "documentType": "medical_receipt",
        "status": "complete",
        "issues": [],
        "isRequired": true
      },
      {
        "documentId": "",
        "documentType": "discharge_summary",
        "status": "missing",
        "issues": ["Document not submitted"],
        "isRequired": true
      },
      {
        "documentId": "DOC-202",
        "documentType": "prescription",
        "status": "type_mismatch",
        "issues": [
          "Document type 'prescription' does not match required document types: medical_receipt, discharge_summary"
        ],
        "isRequired": false
      }
    ],
    "allRequiredDocumentsPresent": false
  },
  "policyVerification": {
    "policyId": "POL-BASIC-001",
    "memberName": "Bob Wilson",
    "policyStatus": "active",
    "claimTypeIsCovered": true,
    "coveragePeriodValid": true,
    "coveragePeriodDetails": "Treatment date not provided; coverage period validation skipped",
    "benefitLimit": 15000,
    "copay": 250,
    "issues": []
  },
  "medicalNecessity": {
    "diagnosis": "Appendectomy",
    "procedures": ["appendectomy"],
    "isClinicallySuitable": true,
    "reasoning": "Appendectomy is the standard surgical treatment for appendicitis or appendix-related conditions",
    "confidenceScore": 0.95,
    "issues": []
  },
  "benefitCalculation": {
    "submittedAmount": 5000,
    "benefitLimit": 15000,
    "coveredAmount": 5000,
    "copay": 250,
    "deductible": 0,
    "memberResponsibility": 250,
    "insuranceResponsibility": 4750,
    "remainingBenefitLimit": 10000,
    "details": "Covered $5000 of $5000 submitted. Copay: $250, Deductible: $0. Member responsible for $250."
  },
  "recommendation": {
    "decision": "REQUEST_MORE_INFO",
    "primaryReason": "Required document 'discharge_summary' is missing from submission",
    "secondaryReasons": [
      "Document 'prescription' submitted but 'discharge_summary' was expected"
    ],
    "actionItems": [
      "Please provide: Required document 'discharge_summary' is missing from submission",
      "Please provide: Document 'prescription' submitted but 'discharge_summary' was expected"
    ]
  },
  "policyCitations": [
    {
      "clause": "Required Documents",
      "clauseName": "Required Documentation Standards",
      "citedText": "medical_receipt, discharge_summary",
      "applicationToThisClaim": "Required document 'discharge_summary' is missing from submission"
    },
    {
      "clause": "Required Documents",
      "clauseName": "Required Documentation Standards",
      "citedText": "medical_receipt, discharge_summary",
      "applicationToThisClaim": "Document 'prescription' submitted but 'discharge_summary' was expected"
    }
  ],
  "toolCallLog": [
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-201" },
      "output": {
        "documentId": "DOC-201",
        "documentType": "medical_receipt",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-05-15"
      },
      "timestamp": "2026-06-12T11:20:22.695Z",
      "sequenceNumber": 1
    },
    {
      "toolName": "verifyDocument",
      "input": { "documentId": "DOC-202" },
      "output": {
        "documentId": "DOC-202",
        "documentType": "prescription",
        "completeness": "complete",
        "issues": [],
        "submittedDate": "2026-05-15"
      },
      "timestamp": "2026-06-12T11:20:22.695Z",
      "sequenceNumber": 2
    },
    {
      "toolName": "lookupPolicy",
      "input": { "policyId": "POL-BASIC-001" },
      "output": {
        "policyId": "POL-BASIC-001",
        "memberName": "Bob Wilson",
        "memberId": "MEM-003",
        "policyType": "basic",
        "policyStartDate": "2025-01-01",
        "policyEndDate": "2026-12-31",
        "policyStatus": "active",
        "coverageInclusions": [
          {
            "claimType": "outpatient_surgery",
            "isCovered": true,
            "benefitLimit": 15000,
            "copay": 250,
            "deductible": 0,
            "waitingPeriod": 0,
            "description": "Outpatient surgical procedures"
          },
          {
            "claimType": "inpatient_hospitalization",
            "isCovered": true,
            "benefitLimit": 30000,
            "copay": 500,
            "deductible": 1000,
            "waitingPeriod": 30,
            "description": "Inpatient hospital stays"
          }
        ],
        "exclusions": [
          {
            "exclusionType": "cosmetic_surgery",
            "description": "Cosmetic procedures are excluded from coverage",
            "policyClause": "4.2"
          }
        ],
        "requiredDocuments": [
          {
            "claimType": "outpatient_surgery",
            "requiredDocs": ["medical_receipt", "discharge_summary"]
          },
          {
            "claimType": "inpatient_hospitalization",
            "requiredDocs": ["medical_receipt", "discharge_summary", "doctor_note"]
          }
        ]
      },
      "timestamp": "2026-06-12T11:20:22.695Z",
      "sequenceNumber": 3
    },
    {
      "toolName": "checkMedicalNecessity",
      "input": {
        "diagnosis": "Appendectomy",
        "procedures": ["appendectomy"]
      },
      "output": {
        "diagnosis": "Appendectomy",
        "procedures": ["appendectomy"],
        "isClinicallySuitable": true,
        "reasoning": "Appendectomy is the standard surgical treatment for appendicitis or appendix-related conditions",
        "confidenceScore": 0.95
      },
      "timestamp": "2026-06-12T11:20:22.695Z",
      "sequenceNumber": 4
    },
    {
      "toolName": "calculateBenefit",
      "input": {
        "policyId": "POL-BASIC-001",
        "claimType": "outpatient_surgery",
        "amount": 5000
      },
      "output": {
        "policyId": "POL-BASIC-001",
        "claimType": "outpatient_surgery",
        "submittedAmount": 5000,
        "benefitLimit": 15000,
        "copay": 250,
        "deductibleApplied": 0,
        "coveredAmount": 5000,
        "memberResponsibility": 250,
        "remainingBenefitLimit": 10000,
        "details": "Covered $5000 of $5000 submitted. Copay: $250, Deductible: $0. Member responsible for $250."
      },
      "timestamp": "2026-06-12T11:20:22.695Z",
      "sequenceNumber": 5
    }
  ]
}
```

## 10. Tool Call Logs

Every assessment includes a full `toolCallLog`.

Each log entry contains:

```json
{
  "toolName": "verifyDocument",
  "input": {},
  "output": {},
  "timestamp": "ISO datetime",
  "sequenceNumber": 1
}
```

The required tool order is always:

```text
1. verifyDocument for each submitted document
2. lookupPolicy
3. checkMedicalNecessity
4. calculateBenefit
```

This provides traceability from the final recommendation back to the factual evidence used by the agent.

## 11. Prompt Design Decisions

The system prompt is designed around the challenge constraints.

### Strict Tool Ordering

The prompt requires the agent to use all 4 tools in the exact required order. This prevents skipped validation steps and keeps the evidence trail complete.

### Anti-Hallucination Instructions

The prompt explicitly instructs the agent to:

- Use `lookupPolicy()` for all policy information.
- Never invent policy clauses, exclusions, limits, copays, deductibles, or required documents.
- Cite only clauses returned by policy lookup.

### Policy Citations

Every recommendation must include policy citations. The guardrails ensure citations are grounded in actual policy lookup output.

### Decision Rules

The prompt defines clear decision behavior:

| Decision | When used |
|---|---|
| `APPROVE` | All required documents are valid, policy is active, claim is covered, treatment is medically necessary, and amount is within benefit limit |
| `REJECT` | Policy is inactive, claim type is not covered, exclusion applies, or treatment is medically unnecessary |
| `REQUEST_MORE_INFO` | Required documents are missing, incomplete, or mismatched |

## 12. Design Decisions / Tradeoffs

### Why Hybrid AI + Deterministic Tools?

A pure LLM implementation may hallucinate policy terms or produce inconsistent decisions. A pure rules engine may be correct but less flexible and less explainable.

The hybrid design gives the best balance:

- **Deterministic tools** provide stable factual evidence.
- **Groq** provides reasoning and natural-language synthesis.
- **Guardrails** preserve required decisions and challenge constraints.

### Guardrails

The implementation enforces:

- No policy hallucination
- Policy terms sourced from `lookupPolicy`
- Benefit limit enforcement
- Missing document handling
- Type mismatch detection
- Tool call traceability

### Groq Integration Note

The project uses Groq through the Vercel AI SDK. The selected model does not support `json_schema` response format, so the implementation uses `generateText()` with structured JSON prompting and JSON parsing, followed by deterministic guardrail merging.

## 13. Limitations

- Policy and document repositories are mock in-memory datasets.
- There is no persistent database.
- `treatmentDate` is optional in the current challenge input. When absent, coverage period validation is intentionally skipped.
- LLM-generated text may vary, but final decisions, benefit calculations, document review, policy verification, and tool logs are guardrailed.

## 14. Submission Notes

This implementation satisfies the challenge constraints:

| Requirement | Status |
|---|---|
| No policy hallucination | ✅ |
| Benefit limit enforced | ✅ |
| Missing required documents → `REQUEST_MORE_INFO` | ✅ |
| Type mismatch documents detected | ✅ |
| All 4 tools invoked in required order | ✅ |
| Tool reasoning traceable | ✅ |
| Structured report output | ✅ |
| Groq LLM integration active | ✅ |

## 15. Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build

# Run official scenarios
npm run test:scenarios
```
