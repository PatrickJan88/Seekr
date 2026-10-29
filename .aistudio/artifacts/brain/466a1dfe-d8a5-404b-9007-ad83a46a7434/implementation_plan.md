# Location Dropdown Component Refinement & Searchable Guardrail Plan

Refines the Location dropdown across the New/Edit Application Form and Job Market views by adding a quick search filter with first-letter keyboard jump, enforcing a strict 1/3 screen height guardrail (`max-h-[33vh]`), and renaming the default filter label from "All Locations" to "Location".

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of User Requirements & Confirmed Decisions:**
> 1. **Integrated Search Box**: When opening any Location dropdown, a clean search input appears at the top to filter countries/cities instantly.
> 2. **First-Letter Quick Jump**: Typing any letter (e.g., 'S' or 's' -> Sweden, Switzerland, Spain) immediately highlights or filters the matching country list from the global location database.
> 3. **Viewport Height Guardrail (1/3 Screen Height)**: Both the Country/City dropdowns in `JobForm.tsx` and the location filter dropdowns in `Kanban.tsx` / `GlobalMarket.tsx` must be constrained to `max-h-[33vh]` with internal smooth scrolling, preventing tall menus from overflowing the screen.
> 4. **Label Update**: Update the default placeholder/trigger label in the Job Market / Kanban filter from "All Locations" to "Location".
> 5. **Form Parity**: Upgrade both the New Application Form and Edit Application Form from raw native `<select>` tags to custom searchable select components.

## 1. Overview & Core Concept

- **What It Does**: Provides a unified, accessible, and fast location selector across Seekr. Users can search by typing text or single letters, view matching countries and cities from the worldwide database, and select locations without cumbersome scrolling through 60+ unconstrained items.
- **Target Audience**: Job seekers logging applications across international markets who need quick, keyboard-friendly country and city selection.
- **Key Value**: Replaces unwieldy full-screen native select menus with responsive, bounded (1/3 viewport height), searchable popovers.

## 2. User Experience & Visual Design

- **Component Locations**:
  1. **New Application Form (`JobForm.tsx`)**: Searchable Country dropdown + Searchable City/State dropdown.
  2. **Edit Application Form (`JobForm.tsx`)**: Same unified searchable component pre-populated with saved data.
  3. **Application Kanban View (`Kanban.tsx` via `Dropdown.tsx`)**: Location country filter renamed to "Location", equipped with quick search input and 1/3 height guardrail.
  4. **Job Market Explorer (`GlobalMarket.tsx` via `NestedLocationMenu.tsx`)**: Default label updated to "Location", menu list capped at `max-h-[33vh]`, with quick country/city search.

- **Visual Specs**:
  - **Dropdown Trigger**: Pill-shaped button (`rounded-full`), white background, subtle border (`#efefef`), height `38px`, displaying active selection with a pin icon and chevron.
  - **Search Input Header**: Sticky top container with `Search` icon (`lucide-react`), autofocus, text input (`text-xs`), and clear button (`X`).
  - **Height Guardrail**: `max-h-[33vh]` (`max-height: 33.33vh`) on the scrollable options list with `overflow-y-auto custom-scrollbar`.
  - **First-Letter Filter / Jump**: Immediate real-time substring and prefix matching (case-insensitive) prioritizing exact first-letter matches.
  - **Empty State**: Clear indicator ("No locations found") when search query yields no results, offering option to use custom location.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Reusable `SearchableSelect` Component for Forms**
  - *Chosen Approach*: Create a modern, accessible `SearchableSelect` in `src/components/ui/SearchableSelect.tsx` that replaces native `<select>` in `JobForm.tsx`.
  - *Why*: Native HTML `<select>` elements cannot embed custom search inputs and render unstyled OS menus that overflow the viewport.
  - *Alternatives Considered*: Native `<datalist>`; rejected because datalists lack consistent cross-browser styling and keyboard navigation.

- **Decision 2: Enhance Existing `Dropdown.tsx` with Search Mode**
  - *Chosen Approach*: Extend `Dropdown.tsx` with `searchable?: boolean` (or enable automatically when options count > 6).
  - *Why*: Instantly upgrades `Kanban.tsx` and all filter bars across the app with zero breaking changes or regressions.

- **Decision 3: Strict 1/3 Viewport Height Guardrail (`33vh`)**
  - *Chosen Approach*: Apply `max-h-[33vh]` on the dropdown popover menu container.
  - *Why*: As shown in the user's screenshots, lists with 50+ countries currently span off-screen; a 33vh cap ensures options stay comfortably visible in the upper viewport.

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   JobForm.tsx                          │
│   (New Application Modal & Edit Application Modal)     │
├──────────────────────────┬─────────────────────────────┤
│ Level 1: Country Select  │ Level 2: City/State Select  │
│ [SearchableSelect]       │ [SearchableSelect]          │
│ • Sticky search input    │ • Sticky search input       │
│ • First-letter quick jump│ • Filtered by Country       │
│ • max-h-[33vh] guardrail │ • max-h-[33vh] guardrail    │
└──────────────────────────┴─────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│             Kanban.tsx & GlobalMarket.tsx              │
│        (Job Market & Application Tracker Views)        │
├────────────────────────────────────────────────────────┤
│ Dropdown.tsx (Kanban):                                 │
│ • Trigger text: "Location" (was "All Locations")       │
│ • Search input with quick letter jump                  │
│ • Guardrail: max-h-[33vh] overflow-y-auto              │
│                                                        │
│ NestedLocationMenu.tsx (GlobalMarket):                 │
│ • Trigger text: "Location" (was "All Locations")       │
│ • Guardrail: max-h-[33vh] with fast country filter     │
└────────────────────────────────────────────────────────┘
```

- **Files to Modify**:
  1. `src/components/ui/SearchableSelect.tsx` (New Component):
     - Search input, first-letter jump, `max-h-[33vh]` guardrail, click-outside handling, clear action.
  2. `src/components/JobForm.tsx`:
     - Replace `<select>` tags in lines 785–840 with `SearchableSelect` for both Country and City fields.
  3. `src/components/ui/Dropdown.tsx`:
     - Add search input when options count > 6, cap menu height with `max-h-[33vh]`.
  4. `src/components/Kanban.tsx`:
     - Change `{ value: '', label: 'All Locations' }` to `{ value: '', label: 'Location' }`.
  5. `src/components/NestedLocationMenu.tsx`:
     - Change default display text from `"All Locations"` to `"Location"`, cap menus at `max-h-[33vh]`.
