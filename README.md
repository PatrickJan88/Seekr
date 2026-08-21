# Seekr

> **Track, evaluate, and land your next tech role. Built in collaboration with AI agents.**
> https://seekr-v5am.onrender.com/

Seekr is a personal application tracker and career dashboard engineered specifically for the tech sector. It bridges the gap between traditional job tracking and active career strategy by combining an interactive data pipeline with an on-device AI evaluator.

## Core Features

### The Intelligent Pipeline
*   **One-Click Capture:** Skip the manual data entry. Let AI instantly extract job details from any market listing and auto-fill your tracking pipeline.
*   **Smart CV Match:** Know where your CV fits before you apply. Compare your CV against a job description securely in the browser to get an alignment score and actionable rewrite suggestions.
*   **Visual Analytics:** Monitor your pipeline at a glance. Analyze your application statistics and track your job search geographically with interactive map visualizations and Sankey diagrams.

### Platform Architecture
*   **Dynamic Dashboard:** Track your job search through customizable stages (Applied, Interviewing, Offer, Rejected) in one centralized Kanban-style view.
*   **Cloud Synchronization:** Keep your career data seamlessly synced across all your devices using Firebase Firestore.
*   **Secure Authentication:** Protect your personal pipeline data with robust Firebase Authentication.
*   **Data Export:** Maintain complete ownership of your data by exporting your application history as a CSV file at any time.

## Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS, Framer Motion
*   **Backend & Auth:** Firebase (Firestore, Authentication)
*   **AI Engine:** Google Gemini API (1.5 Flash)
*   **Data Visualization:** Recharts (Analytics), D3 (Sankey diagrams)
*   **Client-Side Parsing:** `pdfjs-dist` (Zero-server PDF extraction for privacy and cost-efficiency)
*   **CI/CD:** Automated deployments via GitHub Actions

## Getting Started

### Prerequisites
*   Node.js
*   npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PatrickJan88/Seekr.git
   cd Seekr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables. Create a `.env` file in the root directory and add your Firebase credentials and your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   # Add remaining Firebase config variables
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Acknowledgements
Built by [POFEI](https://pofeiportfolio.vercel.app/)
