# Seekr

> **Track, evaluate, and land your next tech role. Built in collaboration with AI agents.**

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

*   **Frontend:** React, Vite, Tailwind CSS
*   **Backend & Auth:** Firebase (Firestore, Authentication)
*   **AI Engine:** Google Gemini API (1.5 Flash)
*   **Client-Side Parsing:** `pdfjs-dist` (Zero-server PDF extraction for privacy and cost-efficiency)
*   **CI/CD:** Automated deployments via GitHub Actions

## Getting Started

To run this project locally, clone the repository and install the dependencies:

```bash
git clone [https://github.com/YourUsername/Seekr.git](https://github.com/YourUsername/Seekr.git)
cd Seekr
npm install

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with Firebase credentials.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

- React (Vite)
- Tailwind CSS
- Firebase (Auth & Firestore)
- Framer Motion
- Recharts (Analytics)
- D3 (Sankey diagrams)

## Acknowledgements

- Built by [POFEI](https://pofeiportfolio.vercel.app/)
