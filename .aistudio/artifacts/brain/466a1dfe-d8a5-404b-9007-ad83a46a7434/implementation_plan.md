# AI Auto-fill Performance Restoration and High-Volume Model Degradation Ladder

Restores instant (<5s) autofill response times in production by introducing a high-volume cascading degradation ladder across Gemini models (3.8-flash down to lightweight flash-lite models), bounding open-source proxy timeouts, and guaranteeing instant fallback to the local deterministic parser.

## User Review and Critical Decisions

> [!IMPORTANT]
> **Cascading Model Degradation Strategy for High Volume:**
> As requested, when `gemini-3.8-flash` experiences high traffic, rate limiting (429), or capacity throttling, the system will gracefully degrade down a ladder of lightweight, fast text-parsing models specifically tuned for quick plain-text extraction:
> 1. `gemini-3.8-flash` (Primary: high accuracy structured extractor, 4s max budget)
> 2. `gemini-3.5-flash-lite` (Degradation Tier 1: ultra-low latency, high volume throughput, 3s max budget)
> 3. `gemini-3.1-flash-lite` (Degradation Tier 2: compact fallback lite model, 3s max budget)
> 4. `gemini-flash-latest` (Degradation Tier 3: dynamic alias for latest flash engine, 3s max budget)
> 5. `gemini-2.5-flash` / `gemini-2.5-flash-lite` (Legacy probe: bypassed immediately if 404 status received)

- **Confirmed Fast-Fail Rules**:
  - If any candidate returns HTTP 404 (deprecated/unavailable) or HTTP 429 (quota/rate limit exceeded), it immediately fails over to the next lighter model without waiting or retrying.
  - Capped cumulative Gemini budget at 6–8 seconds total across all candidates combined.
- **Open-Source and Heuristic Tiers Preserved**:
  - Open-Source Adapter (Tier 2): 3s strict timeout; immediate bypass if the endpoint returns maintenance/offline status.
  - Local Smart Heuristic Parser (Tier 3): Guaranteed instant execution (<5ms, zero network latency) if all upstream AI models are exhausted.

## 1. Overview and Core Concept

- **What It Does**: Streamlines `/api/extract-text` in `server.ts` so users pasting raw job descriptions into Seekr's "Auto-fill fields" box receive instant field population (job title, company, location, salary, employment type, tech stack, and requirements) even during traffic spikes or upstream API throttling.
- **Target Audience**: Candidates and recruiters applying to or posting roles who need reliable, sub-second to sub-5-second form autofill.
- **Key Value**: Delivers responsive text parsing at scale by prioritizing speed and cost-effective degradation over stalled API retries.

## 2. User Experience and Visual Design

- **User Flow**:
  1. User pastes job posting text into the Job Form autofill textarea.
  2. The frontend triggers `POST /api/extract-text`.
  3. Server attempts `gemini-3.8-flash`. Under normal operation, the response completes in 1–2 seconds.
  4. If `gemini-3.8-flash` is throttled or takes >4s, the server instantly steps down to `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite`.
  5. If cloud AI services are down, the server seamlessly executes the local heuristic parser (`parseJobTextSmart`) in <5 milliseconds.
  6. Fields autofill instantly; the UI provides a subtle indication of the extraction provider used (e.g., "Auto-filled via Gemini 3.8", "Auto-filled via Flash Lite", or "Auto-filled via Smart Parser").

## 3. Key Product Decisions and Trade-Offs

- **Decision 1: Cascading Degradation Ladder for High Volume**
  - *Chosen Approach*: Implement sequential step-down from `gemini-3.8-flash` -> `gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest`.
  - *Why*: Flash-lite models consume fewer tokens, have higher rate-limit quotas, and execute with lower latency, making them ideal when high concurrency threatens primary model availability.
  - *Alternatives Considered*: Single model with standard backoff; rejected because backoff adds 10–30s of user waiting time.

- **Decision 2: Immediate Failover on Rate Limits (HTTP 429) and Not Found (HTTP 404)**
  - *Chosen Approach*: Intercept errors in the retry loop: if the error is 429 (rate-limited) or 404 (model deprecated), immediately break to the next candidate model rather than executing SDK exponential backoff.
  - *Why*: Eliminates the cascading 2–3 minute delay identified on Render.

- **Decision 3: Tier 2 and Tier 3 Safety Net**
  - *Chosen Approach*: Maintain the open-source endpoint with a 3s timeout and the local heuristic parser as the final guaranteed fallback.
  - *Why*: Guarantees the user is never left with an empty or broken form.

## 4. Technical Architecture and Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│                (JobForm "Auto-fill fields" Box)                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │ POST /api/extract-text
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server API Pipeline                        │
│                                                                 │
│  [Tier 1: Gemini Degradation Ladder]                            │
│  Total budget: <= 7s                                            │
│  ├── 1. gemini-3.8-flash (4s timeout)                           │
│  │     └── [429 / Timeout / 404] ──► Step Down                  │
│  ├── 2. gemini-3.5-flash-lite (3s timeout)                      │
│  │     └── [429 / Timeout / 404] ──► Step Down                  │
│  ├── 3. gemini-3.1-flash-lite (3s timeout)                      │
│  │     └── [429 / Timeout / 404] ──► Step Down                  │
│  └── 4. gemini-flash-latest (3s timeout)                        │
│        └── [Exhausted / Out of Quota]                           │
│                     │                                           │
│                     ▼                                           │
│  [Tier 2: Open-Source AI Endpoint]                              │
│  3s timeout / immediate abort if in maintenance                 │
│  └── [Timeout / Offline / Unavailable]                          │
│                     │                                           │
│                     ▼                                           │
│  [Tier 3: Local Deterministic Parser]                           │
│  parseJobTextSmart (zero network, execution time: <5ms)         │
│  └── Always succeeds and returns extracted fields               │
└─────────────────────────────────────────────────────────────────┘
```

- **Interactive State and Component Mapping**:
  - `server.ts`:
    - Refactor `generateContentWithRetry` with `AbortSignal.timeout` per candidate model.
    - Handle HTTP 404 and HTTP 429 status codes explicitly to trigger immediate failover without backoff pauses.
    - Return `modelUsed` and `tierUsed` in the JSON response (`"gemini-3.8-flash"`, `"gemini-3.5-flash-lite"`, `"open_source"`, `"local_heuristic"`).
  - `JobForm.tsx`:
    - Display the source badge next to the "Auto-filled" status (e.g. "Auto-filled in 1.2s via Gemini 3.8 Flash" or "Auto-filled in 0.05s via Local Parser").
