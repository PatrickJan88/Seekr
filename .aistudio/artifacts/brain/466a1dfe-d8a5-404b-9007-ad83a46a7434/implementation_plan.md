# Studio PDF Export & Browser Preview Enhancement

Enhances the Export PDF capability across all studios in Application Studio (Resume Studio, Cover Letter Studio, Interview Prep Studio) and Company 360 by introducing a dedicated server-side PDF endpoint. When users click "Export PDF", the app opens a new browser tab using `window.open()` pointing to the PDF endpoint, allowing modern browsers to render a native PDF preview with an integrated toolbar and download icon.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed based on your selections during clarification:
> - **PDF Generation Mechanism**: Server endpoint converting studio HTML content into standard binary PDF (`application/pdf`) with `Content-Disposition: inline`.
> - **Studio Scope**: All Application Studios (Cover Letter Studio, Resume Studio, Interview Prep Studio) plus Company 360 Report Studio.
> - **Tab Navigation & Popup Blocker Protection**: Synchronous tab initialization upon click (`window.open('about:blank', '_blank')`) followed by immediate redirection to the endpoint URL (`/api/export-pdf/:id`) once prepared, preventing browser popup blocking while streaming high-fidelity PDF binaries.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the Export PDF action from raw browser window printing to a dedicated binary PDF preview endpoint. Users clicking "Export PDF" in any studio will see a clean, new browser tab containing the rendered PDF document equipped with native browser controls (page thumbnails, zoom, print, and one-click download).
- **Target Audience / Persona**: Job seekers and career professionals crafting tailored resumes, cover letters, interview prep dossiers, and company intel dossiers who need to preview and immediately download clean PDF files.
- **Key Value**: Delivers a seamless native preview experience matching modern web app expectations, eliminating print-preview popup glitches and granting direct access to the browser's built-in PDF download toolbar.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Studio Authoring**: The user edits their resume, cover letter, interview questions, or company research report in Application Studio.
2. **Export Click**: The user clicks the primary `"Export PDF"` button in the studio action bar.
3. **Instant Tab Launch & Visual Feedback**:
   - The studio button displays an active processing state with a subtle loader or status feedback.
   - A new browser tab opens immediately in the background or foreground (`target="_blank"`).
4. **Native PDF Preview**:
   - The new tab loads `/api/export-pdf/:id`.
   - The browser recognizes the `application/pdf` MIME type and launches its built-in PDF viewer with zoom controls, page navigation, print button, and download icon.
   - If the user closes or dismisses the tab, the studio state remains intact with a success toast confirmation.

### Visual Identity & Theme

- **Aesthetic Direction**: Minimal, clean Swiss-inspired enterprise design adhering to the existing Seekr palette (neutral warm background `#FAF9F7`, crisp white card surfaces `#FFFFFF`, hairline borders `#EFEFEF`, and primary cobalt blue `#0068F9`).
- **Button Styling**: Clean rounded pill or rounded-2xl action button with single-line typography (`whitespace-nowrap shrink-0`), subtle hover lift, and clear tooltip indicating PDF generation.
- **Feedback & Feedback States**: Replaces error-prone popup alerts with clean Sonner toasts informing users when the PDF preview has been generated.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side PDF Endpoint (`/api/export-pdf/:id`)**
  - *Chosen Approach*: Express server route that ingests the studio's generated HTML structure, generates an A4/Letter compliant binary PDF document, and responds with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="[Studio_Document].pdf"`.
  - *Why*: Direct `window.open(url, '_blank')` to an endpoint serving `application/pdf` is the universal, standard way to trigger the browser's built-in PDF previewer and integrated toolbar.
  - *Alternatives Considered*: Client-side blob URL (`URL.createObjectURL(blob)`). While fast, blob URLs in new tabs often lack proper document titles, can trigger browser security restrictions in sandboxed iframes, and do not persist across reloads.
- **Decision 2: Tokenized Session Cache for Export Payloads**
  - *Chosen Approach*: When Export PDF is clicked, a lightweight prepare call (`POST /api/export-pdf/prepare`) caches the HTML payload with a 10-minute TTL and returns an export ID. The opened tab then fetches `/api/export-pdf/:id`.
  - *Why*: Allows large HTML documents with rich styling and inline SVGs to be transferred reliably without URL length limitations (GET URLs with huge base64 strings frequently fail in browsers).
  - *Alternatives Considered*: Passing full HTML in query parameters (exceeds URL length limits) or submitting an invisible POST form target to a new window (creates browser back-button warnings and re-post dialogs).

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION STUDIOS                           │
│  CoverLetterStudio  │  ResumeStudio  │  InterviewPrep  │  Company360   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Calls handleExportPdf()
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        src/lib/pdf-export.ts                           │
│  1. Opens placeholder tab: const win = window.open('about:blank')     │
│  2. Calls POST /api/export-pdf/prepare { html, title, filename }       │
│  3. Redirects target tab: win.location.href = /api/export-pdf/:id      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                     HTTP API Request / Fetch
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             server.ts                                  │
│  - POST /api/export-pdf/prepare -> Stores payload, returns export ID   │
│  - GET  /api/export-pdf/:id     -> Converts HTML to binary PDF buffer  │
│                                    Sets Header: Content-Type: pdf      │
│                                    Sets Header: Content-Disposition    │
│                                    Streams binary to browser tab       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BROWSER NATIVE PDF VIEWER                          │
│  • New Browser Tab with PDF Document Preview                           │
│  • Integrated Browser Toolbar (Download Icon, Print, Zoom)             │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Export Payload

```typescript
interface PdfExportPayload {
  id: string;
  title: string;
  filename: string;
  html: string;
  createdAt: number;
}
```

### Integration Across Studios

1. **`src/lib/pdf-export.ts`**:
   - Refactor `triggerDirectPdfExport(htmlDocument: string, options?: { title?: string; filename?: string })` to invoke the prepare route and open `/api/export-pdf/:id` via `window.open(..., '_blank')`.
2. **`server.ts`**:
   - Add in-memory TTL map (`pdfExportStore = new Map<string, PdfExportPayload>()`) with automatic pruning.
   - Implement `POST /api/export-pdf/prepare` to store and generate the unique ID.
   - Implement `GET /api/export-pdf/:id` to generate standard binary PDF with headers:
     - `Content-Type: application/pdf`
     - `Content-Disposition: inline; filename="${filename}"`
     - `Cache-Control: private, max-age=300`
3. **Application Studios**:
   - `src/components/ResumeTemplateStudio.tsx`: Pass document title (e.g. `Resume_${name}.pdf`).
   - `src/components/CoverLetterStudio.tsx`: Pass document title (e.g. `Cover_Letter_${company}.pdf`).
   - `src/components/InterviewPrepStudio.tsx`: Pass document title (e.g. `Interview_Prep_${company}.pdf`).
   - `src/components/CompanyIntelligenceStudio.tsx`: Pass report title (e.g. `Company_Report_${company}.pdf`).
