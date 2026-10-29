# Cover Letter Studio & PDF Preview 1:1 Layout Alignment Plan

Synchronizes typography, line-height, paragraph spacing, and 22mm page margins between Cover Letter Studio and the server PDF generation engine, ensuring exported PDFs fill the A4 page identically to the on-screen studio preview.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause of the Large Bottom Margin in PDF Preview:**
> 1. **Font Size & Spacing Discrepancy**: Cover Letter Studio displays text at `text-base` (~16px / 12pt) with `leading-relaxed` (line-height ~1.625) and `1.25em` paragraph margins. In contrast, `pdfGenerator.ts` generated PDFKit pages with hardcoded `9.5pt` font and a tiny `0.35` (~3.3pt) paragraph gap, consuming ~40% less vertical space.
> 2. **Margin Width Mismatch**: The on-screen studio canvas uses 22–24mm horizontal margins (`px-12` on a 794px canvas), whereas `pdfGenerator.ts` used `36pt` (12.7mm) margins. The wider PDF line width squeezed text horizontally, wrapping into fewer lines and terminating high above the bottom.
> 3. **Style Preset Decoupling**: While the studio offers "Modern", "Classic", and "Executive" typography presets, the PDF engine used generic `Helvetica 9.5pt` for all documents.

- **Confirmed Decision**: Synchronize exact 22mm A4 margins (`62.4pt`) with studio page breaks, 11pt typography, 1.62 line-height (`lineGap: 4.5pt`), and proportional `1.0em` paragraph spacing.

## 1. Overview & Core Concept

- **What It Does**: Calibrates the server-side PDF generator (`src/services/pdfGenerator.ts`) and export pipeline (`src/components/CoverLetterStudio.tsx`) to achieve 1:1 visual parity between the browser studio canvas and downloaded/previewed A4 PDF files.
- **Target Audience**: Job applicants crafting cover letters who need their printed or emailed PDF documents to look polished, well-spaced, and properly proportioned without awkward blank gaps.
- **Key Value**: What you see in the Cover Letter Studio is exactly what renders in the PDF preview tab and exported document.

## 2. User Experience & Visual Design

- **Visual Alignment**:
  - **A4 Geometry**: Exact ISO A4 dimensions (210mm × 297mm = 595.28pt × 841.89pt).
  - **Margins**: Top 24mm (`68pt`), Bottom 20mm (`56.7pt`), Left 22mm (`62.4pt`), Right 22mm (`62.4pt`).
  - **Content Width**: Identical 470.5pt readable column width matching the on-screen studio canvas.
  - **Typography & Hierarchy**:
    - Body Text: 11pt (with `Helvetica`, `Times-Roman`, or `Georgia` matching style presets).
    - Line Spacing: 1.62 ratio (`lineGap: 4.5pt`).
    - Paragraph Gaps: `1.0em` (~11pt spacing) between paragraphs rather than the previous 3.3pt.
    - Headings / Sign-off: Properly proportioned signature block ("Sincerely,\nName") that sits comfortably near the bottom watermark footer.
  - **Watermark Footer**: Consistent single-line rule and "Powered by Seekr https://seekr-v5am.onrender.com/ Page X of Y" positioned at the bottom margin boundary.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Match 22mm Margin Metrics in PDFKit**
  - *Chosen Approach*: Update `margins: { top: 68, bottom: 56, left: 62.4, right: 62.4 }` in `pdfGenerator.ts`.
  - *Why*: Directly reproduces the studio's `px-12` margin density, preventing horizontal text flattening.
  - *Alternatives Considered*: Leaving 36pt margins; rejected because it forces 300+ words into the upper half of the page.

- **Decision 2: Style-Aware Font and Sizing in PDF Generation**
  - *Chosen Approach*: Inspect HTML font-family / class attributes in `pdfGenerator.ts` to set 11pt serif (`Times-Roman` / `Georgia`) for Classic and Executive presets, and 11pt sans-serif (`Helvetica`) for Modern.
  - *Why*: Retains the visual personality chosen by the user in the Studio toolbar.

- **Decision 3: Page Boundary Synchronization**
  - *Chosen Approach*: Respect `.a4-page-sheet` boundaries from `snapshotDomPages()` so each page in the editor maps directly to a discrete page in PDFKit without premature or delayed page overflow.
  - *Why*: Eliminates accidental multi-page spillovers and ensures page-count consistency.

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│               Cover Letter Studio UI                   │
│  • A4 Canvas: 794px × 1123px (210mm × 297mm)           │
│  • Padding: 22mm Left/Right, 24mm Top, 20mm Bottom     │
│  • Typography: 11pt (16px scaled), 1.62 line-height    │
│  • Paragraph Gap: 1.0em - 1.25em                       │
└──────────────────────────┬─────────────────────────────┘
                           │ "Export PDF" Click
                           │ (HTML with .a4-page-sheet & styles)
                           ▼
┌────────────────────────────────────────────────────────┐
│            POST /api/export-pdf/prepare                │
│            GET /api/export-pdf/:id                     │
└──────────────────────────┬─────────────────────────────┘
                           │ Converts HTML to PDFKit Stream
                           ▼
┌────────────────────────────────────────────────────────┐
│             pdfGenerator.ts (PDFKit Engine)            │
│  • Margins: { top: 68, bottom: 56, left: 62, right: 62 }│
│  • Printable Width: 470.5pt (matches 22mm margins)     │
│  • Body Typography: 11pt, lineGap: 4.5pt               │
│  • Paragraph Spacing: doc.moveDown(0.85) (~10pt)       │
│  • Preset Fonts: Helvetica / Times-Roman / Georgia     │
│  • Watermark Footer: Y = doc.page.height - 28pt        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Preview Tab (Browser PDF Viewer)           │
│  • Text naturally fills the A4 sheet down to footer    │
│  • "Sincerely, Pofei" placed near bottom as in Studio  │
│  • Zero awkward 50% blank bottom space                 │
└────────────────────────────────────────────────────────┘
```

- **Files to Modify**:
  1. `src/services/pdfGenerator.ts`:
     - Update page margins to exact 22mm geometry.
     - Increase body text font size to 11pt and lineGap to 4.5.
     - Increase paragraph bottom spacing to `moveDown(0.85)`.
     - Detect document style preset ('classic' / 'executive' / 'modern') and apply matching standard PDF fonts.
  2. `src/components/CoverLetterStudio.tsx`:
     - Verify print CSS in `handlePrint` has matching 22mm margins and line heights.
