# Seekr — Intelligent Career Pipeline & AI Evaluator

<div align="center">

![Seekr Logo](/public/assets/seekr%20logo%201.webp)

**Track, evaluate, and land your next tech or academic role.**  
*An all-in-one career intelligence platform and AI agent pipeline.*

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg?style=flat-square)](https://github.com/PatrickJan88/Seekr)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?logo=firebase&style=flat-square)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google&style=flat-square)](https://ai.google.dev/)
[![Node/Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&style=flat-square)](https://expressjs.com/)

[**Live Application Preview**](https://seekr-v5am.onrender.com/) • [**Portfolio**](https://pofeiportfolio.vercel.app/) • [**Report an Issue**](https://github.com/PatrickJan88/Seekr/issues)

</div>

---

## Overview

**Seekr** bridges the gap between passive job application tracking and active, AI-assisted career strategy. Engineered for software engineers, data scientists, researchers, and tech professionals, Seekr combines high-performance client-side visual pipelines with server-side AI engines to analyze job postings, evaluate CV compatibility, generate tailored application materials, and track interview milestones.

---

## What's New in Version 4.0.0

Version `4.0.0` introduces standalone left-panel access for Company 360 Intelligence and Tailored Application Studios, alongside a suite of Advanced Rich Document Studio editing tools featuring interactive link management, bullet list formatting, and multi-page persistence.

### Major Highlights

*   **Company 360 Intelligence Studio**:
    *   **Direct Workspace Access**: Accessible directly from the collapsible left navigation panel for comprehensive enterprise and startup research.
    *   **Holistic Teardowns**: Generates strategic company teardowns, core product loop analysis, SWOT matrices, AI positioning assessments, and tailored interview pitch talking points on demand.
*   **Tailored Application Studios**:
    *   **Direct Navigation Access**: Instant entry to **Cover Letter Studio**, **Interview Prep Studio**, and **Resume Tailoring Studio** directly from the primary left sidebar.
    *   **Versatile Ad-Hoc Generation**: Craft tailored cover letters, targeted STAR-method question frameworks, and ATS-optimized resume sections on demand for any opportunity without needing to bind to an existing job application entry.
*   **Job Market "Matched Up" Intelligent Ranking & Recommendations**:
    *   **Automated Relevance Ordering**: Compares the user's uploaded CV against live market listings, automatically sorting and ranking roles from most to least relevant.
    *   **Tailored Opportunity Suggestions**: Highlights customized matching job suggestions based on skill alignment, domain qualifications, and experience level.
*   **Advanced Rich Document Studio Tools**:
    *   **WYSIWYG Editing Suite**: Full-featured formatting toolbar equipped with Bold, Italic, Underline, Strikethrough, Headings (H1/H2), Blockquotes, Text Color picker, Highlighter, and dedicated **Bullet Point** (`List`) list formatting with active selection state tracking.
    *   **Interactive Link Navigation & Re-Click Removal**:
        *   *Click-to-Open*: Direct single-click navigation for validated links to open in a secure external tab (`target="_blank" rel="noopener noreferrer"`).
        *   *Re-Click to Unlink*: Seamlessly toggle off link styling and attributes by clicking the link tool on any active linked selection, instantly converting text back to standard body formatting.
    *   **Multi-Page Canvas & Print Engine**: Multi-page document canvas with automatic page overflow pagination, live word counter, one-click copy, print-to-PDF formatting, and continuous local and cloud document persistence.
*   **Dual Tracking Framework (Industry & Academic Systems)**:
    *   Switch between **Industry Seekr** and **Academic Seekr** workflows with dedicated pipeline stages (e.g., Screening, Job Talks, Campus Visits, Committee Reviews, Grant proposals).
*   **Enhanced Document & Media Attachment Engine**:
    *   **Client-Side Canvas Compression**: High-res images are automatically resized and compressed client-side (~40KB–90KB) to ensure lightning-fast Firestore operations and stay well within cloud document quotas.
    *   **Instant Eye Preview & Lightbox**: Interactive preview button with full-screen lightbox modal for viewing images and document attachments.
    *   **Multi-Format File Support**: Native handling for PDF, DOC, DOCX, XLS, XLSX, CSV, and image files.
*   **Global Job Market Explorer**:
    *   Live aggregated listings across continents and countries with remote filters and one-click pipeline import.
*   **Interactive Sankey Pipeline & Analytics**:
    *   Visual flow tracking from initial application to offer or rejection with conversion funnel analytics.

---

## Tech Stack

### **Frontend**
*   **Framework**: [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
*   **Build Tooling**: [Vite 6](https://vitejs.dev/) with native ES module compilation
*   **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons
*   **Animations**: [Motion](https://motion.dev/) (Framer Motion v13)
*   **Visualizations**: [Recharts 3](https://recharts.org/), [Apache ECharts 6](https://echarts.apache.org/), D3 Sankey Diagrams
*   **Client-Side Document Parsing**: `pdfjs-dist` (Zero-server PDF extraction for privacy and speed), `xlsx`, `papaparse`

### **Backend & APIs**
*   **Server Runtime**: [Node.js](https://nodejs.org/) with [Express](https://express.js.org/) + `tsx` / `esbuild`
*   **AI Engine**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini 2.5 Flash / 2.0 Flash) with universal OpenAI-compatible fallback adapters
*   **Web Scraping & Extraction**: `jsdom`, `rss-parser`

### **Database & Authentication**
*   **Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore) with custom deep sanitization
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Google OAuth & Anonymous Guest Login)

---

## Core Features & Modules

```
├── 📊 Pipeline & Overview (Sankey Flow Chart & Activity Funnel)
├── 🌍 Global Job Market (Live Feed Aggregator & 1-Click Import)
├── 📋 Applications Manager (Kanban Board & Data Table ListView)
├── 📈 Deep Analytics (Conversion Funnels, Timeline Trends & Salary Distributions)
├── 🤖 AI Career Studios
│   ├── 🎯 CV Match & Evaluator (ATS Score, Keyword Heatmap & Gaps)
│   ├── ✍️ Cover Letter Studio (Custom AI Generation)
│   ├── 🎙️ Interview Prep Studio (STAR Guides & Custom Q&A)
│   └── 📄 Resume Tailoring Studio (Section-by-Section ATS Alignment)
├── 📎 Smart Document Attachment System (Client-Side Compression & Lightbox)
└── ⚙️ Settings & System Customization (Industry vs. Academic Tracking)
```

### 1. The Intelligent Pipeline
*   **One-Click Job Extraction**: Paste raw job text, LinkedIn/Indeed URLs, or job descriptions to auto-extract company, role, location, salary, and notes.
*   **Interactive Kanban & List Views**: Drag-and-drop workflow with customizable stages, filters, search, and bulk export.
*   **Interview Reminders**: Configurable reminders with calendar integration for upcoming rounds.

### 2. AI Evaluator & Studios
*   **CV vs. Job Alignment**: Instant scoring across skills, experience, and educational requirements.
*   **Actionable Gap Identification**: Pinpoints missing keywords and suggested bullet-point improvements.
*   **Evaluation History**: Revisit previous evaluation reports and track resume revisions over time.

### 3. Attachments & Asset Management
*   **Smart Canvas Compression**: In-browser client-side compression prevents multi-megabyte payloads from exceeding Firestore document boundaries.
*   **Dedicated Eye Preview**: Preview attached mockups, offer letters, resumes, or interview assignments in an integrated lightbox modal.

---

## Getting Started

### Prerequisites
*   **Node.js**: v18.0.0 or higher
*   **npm** / **yarn** / **pnpm** / **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PatrickJan88/Seekr.git
   cd Seekr
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Firebase Client Config (Exposed to browser)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## Version History & Changelog

### **v4.0.0** — *Current Release*
*   Added **Job Market "Matched Up" Intelligent Ranking & Recommendations**, automatically sorting live market listings from most to least relevant and delivering tailored role matches for uploaded candidate CVs.
*   Added **Left-Panel Access for Company 360 Studio** for on-demand company intelligence, business loop teardowns, SWOT analysis, and interview alignment.
*   Added **Left-Panel Access for Tailored Application Studios** (Cover Letter, Interview Prep, Resume Tailoring) for standalone, ad-hoc career generation without pre-existing application constraints.
*   Added **Advanced Rich Document Studio Tools** with WYSIWYG text styling, **Bullet Point List Formatting** (`List`), color palettes, highlight tools, and **Multi-Page Auto-Pagination & Persistence**.
*   Added **Interactive Link Navigation & Re-Click Unlink** (open links in new tab, re-click to remove link styling).

### **v3.0.0**
*   Added **Company 360 Studio** for deep strategic company analysis and interview preparation.
*   Added **Dual Tracking Systems** (Industry vs. Academic Seekr pipelines).
*   Introduced **AI Cover Letter Studio**, **Interview Prep Studio**, and **Resume Tailor Studio**.
*   Built **Client-Side Canvas Compression** for image attachments with zero storage lag.
*   Added **Interactive Eye Preview Lightbox** for visual file inspection.
*   Redesigned **Links & Notes** layout with clean typographic hierarchy and full-width actions.
*   Upgraded to **React 19** and **Tailwind CSS v4**.
*   Hardened Firestore serialization layer with deep map sanitization.

### **v2.0.0**
*   Integrated Google Gemini 2.0 Flash SDK on backend API endpoints.
*   Introduced Sankey Pipeline flow diagram and geographic application mapping.
*   Added PDF client-side parsing via `pdfjs-dist` for zero-server resume extraction.
*   Implemented Firebase Firestore real-time cloud data synchronization.

### **v1.0.0**
*   Initial release of Seekr job tracker with Kanban board and Google Authentication.

---

## Security & Privacy

*   **Zero-Leak PDF Extraction**: All resume text parsing runs entirely client-side inside Web Workers using `pdfjs-dist`. Raw PDF files never leave your browser unless explicitly saved as an attachment.
*   **Server-Side AI Proxies**: API keys (`GEMINI_API_KEY`) remain strictly on the backend and are never exposed to browser clients.
*   **Granular Firestore Security Rules**: Ensures users can only query, write, and mutate their own personal records.

---

## Author & Acknowledgments

*   **Creator**: [POFEI (Ran Pofei)](https://pofeiportfolio.vercel.app/)
*   **LinkedIn**: [@pofei-r-79586395](https://www.linkedin.com/in/pofei-r-79586395)
*   **GitHub**: [@PatrickJan88](https://github.com/PatrickJan88)

---

<div align="center">
  <sub>Seekr is an AI-assisted open-source portfolio project designed for career enhancement and research purposes.</sub>
</div>
