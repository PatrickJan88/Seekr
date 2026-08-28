# AI Evaluator Mechanism: Official Norms & 6-Dimension Specification

This document defines the standardized normative evaluation framework for the AI CV & Job Description Matcher in JobFlow. All AI prompt templates, scoring algorithms, deterministic fallbacks, and UI visualizations strictly adhere to these specifications.

---

## 1. The 6 Core Matching Dimensions

| Dimension | What to Extract & Compare | Metric Type | Standard Weight |
| :--- | :--- | :--- | :--- |
| **1. Hard Skills & Tech Stack** | Specific tools, programming languages, platforms, and methodologies (e.g., React, Figma, SQL, CI/CD, TypeScript). | Match Rate (%) & Critical Gap Count | **30%** |
| **2. Seniority & Experience Scope** | Total years of relevant experience, title level (Junior/Mid/Senior/Staff/Lead), team size managed, and scope/complexity of past projects. | Delta Score (e.g., Target: 5 yrs vs Actual: 4 yrs $\rightarrow$ 80% fit) | **20%** |
| **3. Domain & Industry Relevance** | Familiarity with business models or sector nuances (e.g., B2B SaaS, FinTech, E-commerce, HealthTech, Developer Tooling). | Semantic Similarity (0.0 to 1.0) | **20%** |
| **4. Methodology & Soft Competencies** | Collaboration styles, Agile/Scrum, stakeholder management, user research practices, or problem-solving approaches. | Evidence-based Keyword & Context Match | **15%** |
| **5. Credentials & Education** | Degrees, certifications, licenses (e.g., AWS Certified, PMP, B.S./M.S. in CS or related field). | Binary Match (Pass/Fail) with flexible equivalence | **10%** |
| **6. Operational & Practical Constraints** | Work model (Remote/Hybrid/On-site), location/time zone, work authorization/visa, and language proficiencies. | Hard Gate / Knockout (Binary: Pass/Fail) | **Gatekeeper (5%)** |

---

## 2. Mathematical Scoring Model & Formula

### 1. The Mathematical Formula (Weighted Average / Dot Product)
To calculate the overall match score using weights, JobFlow uses a **Weighted Average (Dot Product)** where each evaluated dimension score ($S_i \in [0, 100]$) is multiplied by its relative weight ($w_i$), and the sum equals the final composite score.

The sum of all weights must equal **1.0 (or 100%)**:

$$\sum_{i=1}^{n} w_i = 1.0$$

The final score is calculated as:

$$\text{Final Score} = \sum_{i=1}^{n} (S_i \times w_i) = (S_1 \times w_1) + (S_2 \times w_2) + \dots + (S_n \times w_n)$$

* $S_i$ = Individual dimension score for dimension $i$ (from $0$ to $100$).
* $w_i$ = Weight assigned to dimension $i$ (as a decimal between $0.0$ and $1.0$).

---

### 2. Standard Baseline Weight Distribution

When operational constraints (Hard Gate) pass, the standard baseline weight distribution across evaluated dimensions is:

| Dimension ($i$) | Metric | Weight ($w_i$) | Percentage |
| :--- | :--- | :--- | :--- |
| **$S_1$: Hard Skills & Tech Stack** | Match rate of tools, frameworks, and core technical competencies. | **0.35** | 35% |
| **$S_2$: Experience & Seniority** | Alignment with required years of experience and role seniority. | **0.25** | 25% |
| **$S_3$: Domain & Industry** | Familiarity with business sector (e.g., B2B SaaS, FinTech, E-commerce). | **0.20** | 20% |
| **$S_4$: Methodology & Soft Skills** | Collaboration processes, agile practices, research workflows. | **0.10** | 10% |
| **$S_5$: Education & Certifications** | Relevant degrees, certifications, or direct equivalents. | **0.10** | 10% |
| **Total** | | **1.00** | **100%** |

*(Note: When operational gating is explicitly modeled as a weighted factor in 6-dimension mode, weights adapt to $[0.30, 0.20, 0.20, 0.15, 0.10, 0.05]$ where operational gate acts as a knockout constraint).*

---

### 3. Step-by-Step Calculation Example

Suppose a candidate has the following sub-scores for a specific job:

* Hard Skills ($S_1$) = **85**
* Experience ($S_2$) = **70**
* Domain ($S_3$) = **90**
* Methodology ($S_4$) = **80**
* Education ($S_5$) = **60**

$$\text{Final Score} = (85 \times 0.35) + (70 \times 0.25) + (90 \times 0.20) + (80 \times 0.10) + (60 \times 0.10)$$

$$\text{Final Score} = 29.75 + 17.50 + 18.00 + 8.00 + 6.00 = \mathbf{79.25\%}$$

**Result:** **79.25%** $\rightarrow$ Falls into the **Medium Match (60% – 79%)** tier.

---

### 4. Dynamic Weighting (Advanced Best Practice)

Instead of static weights for every job, the evaluator can dynamically adjust weights based on what the job description emphasizes:

* **Keyword Frequency / Section Prominence:** If a JD explicitly marks a section as *"Mandatory Technical Skills"* and lists 15 frameworks with zero mentions of education, weights shift dynamically:
  * Hard Skills: $0.35 \rightarrow \mathbf{0.50}$
  * Education: $0.10 \rightarrow \mathbf{0.00}$ (re-normalize the remaining dimensions so total = $1.0$).

* **Normalization Formula when adjusting on the fly:**

$$w'_i = \frac{w_i}{\sum w_{\text{active}}}$$

---

## 3. Critical Guardrail: The "Hard Gate" Rule

A purely weighted numerical score can produce false positives. For example, a candidate could match 100% of the UI design skills, but lack the legal right to work in the destination country or be fully remote when the job is strictly on-site.

### Hard Gate Enforcement:
1. **Operational Constraints (Work Authorization, Language, Location/Visa, Work Model):**
   - If an operational Hard Gate fails (e.g., visa sponsorship unavailable or strict on-site requirement in an unviable location), the **Overall Match Score is automatically capped at Low (< 60%)** or tagged with an explicit `Disqualified: Operational Constraint` status, regardless of technical skill overlap.
2. **Mandatory Tech Requirements:**
   - If the role requires a non-negotiable core skill (e.g., 3+ years in React/TypeScript) and the candidate has zero substantiated evidence, a heavy penalty is deducted from the Hard Skills dimension ($>50\%$ penalty) so the candidate cannot cross into the $\ge 80\%$ tier solely through soft competencies.

---

## 4. Requirement Tiers (Must-Have vs. Nice-to-Have)

- **Core "Must-Haves" Coverage:**
  - Percentage of non-negotiable requirements met in the CV.
  - **Threshold Warning:** If Must-Have coverage is $< 70\%$, a prominent warning banner is triggered alerting the candidate to missing baseline qualifications.
- **"Nice-to-Haves" Bonus:**
  - Additional points (up to $+10\%$) that elevate a candidate from baseline compliance into top-tier candidate status.

---

## 5. Critical Gap Index (Negative Metric)

Evaluates the count, category, and severity of missing requirements:
- **Easily Bridgeable Gaps:** Fast-to-learn tooling or minor workflow differences (e.g., Linear vs. Jira, Tailwind vs. Styled-Components, Vite vs. Webpack).
- **High-Effort Gaps:** Missing fundamental domain knowledge or technical competencies requiring months of dedicated ramp-up (e.g., requiring 3+ years of native Swift/iOS when the candidate has only web frontend experience).

---

## 6. Semantic Relevance (Context Over Keywords)

Measures whether candidate achievements match the *intent* of the Job Description, not just superficial string tokens:
- *Example:* "Architected modular design system for 40+ production components" semantically fulfills "Led UI consistency and reusable library architecture across enterprise web platforms", even if exact terminology varies.

---

## 7. Tier Breakdown & Recommended Product Actions

| Tier | Score Range | Status Label | Meaning for Candidate | Recommended Product Action |
| :--- | :--- | :--- | :--- | :--- |
| **High Match** | $\ge 80\%$ | **Strong Fit** (Green) | Meets almost all primary "must-have" technical/domain requirements and seniority expectations. | **1-Click Apply / Priority Queue:** Prompt user to apply immediately. Generate tailored outreach bullets and cover letter. |
| **Medium Match** | $60\% - 79\%$ | **Potential / Stretch** (Amber) | Strong foundational alignment, but missing 1–2 specific domain terms, tools, or seniority years. | **Optimization Mode:** Highlight top 2–3 addressable keyword/skill gaps that could lift score over $80\%$. |
| **Low Match** | $< 60\%$ | **Significant Gap** (Muted/Red) | Missing core mandatory qualifications, mismatched discipline, or failing a hard operational constraint. | **Filter / Deprioritize:** Flag as a low-probability application to prevent user fatigue. |
