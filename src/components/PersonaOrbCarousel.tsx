import React, { useState, useRef, useEffect } from 'react';
import AgentAvatar from './AgentAvatar';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export interface TechRole {
  id: string;
  label: string;
  desc: string;
  category: 'engineering' | 'ai_data' | 'product_design';
}

export const TECH_ROLES: TechRole[] = [
  { 
    id: 'Product Manager', 
    label: 'Product Manager', 
    desc: 'Focus: Strategy, Roadmap, User Metrics & Agile Delivery',
    category: 'product_design'
  },
  { 
    id: 'UX/UI Designer', 
    label: 'UX/UI Designer', 
    desc: 'Focus: Design Systems, Prototyping, Figma & User Research',
    category: 'product_design'
  },
  { 
    id: 'Frontend Developer', 
    label: 'Frontend Developer', 
    desc: 'Focus: React, TypeScript, State, Performance & CSS Architecture',
    category: 'engineering'
  },
  { 
    id: 'Backend Developer', 
    label: 'Backend Developer', 
    desc: 'Focus: APIs, Microservices, Databases, Concurrency & Scaling',
    category: 'engineering'
  },
  { 
    id: 'Fullstack Developer', 
    label: 'Fullstack Developer', 
    desc: 'Focus: End-to-End Delivery, DB Schema, Frontend & Node/Python',
    category: 'engineering'
  },
  { 
    id: 'AI Engineer', 
    label: 'AI Engineer', 
    desc: 'Focus: Model Tuning, PyTorch, RAG, Inference & GenAI Systems',
    category: 'ai_data'
  },
  { 
    id: 'LLM Engineer', 
    label: 'LLM Engineer', 
    desc: 'Focus: Prompting, Agentic Workflows, Fine-Tuning & Guardrails',
    category: 'ai_data'
  },
  { 
    id: 'Data Analyst', 
    label: 'Data Analyst', 
    desc: 'Focus: SQL, Visualization, Funnel Metrics & Experimentation',
    category: 'ai_data'
  },
  { 
    id: 'QA Engineer', 
    label: 'QA Engineer', 
    desc: 'Focus: Automation, Integration Tests & CI/CD Pipelines',
    category: 'engineering'
  },
  { 
    id: 'Systems Architect', 
    label: 'Systems Architect', 
    desc: 'Focus: Distributed Infrastructure, Cloud Security & High Availability',
    category: 'engineering'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Evaluators' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'ai_data', label: 'AI & Data' },
  { id: 'product_design', label: 'Product & Design' }
];

interface PersonaOrbCarouselProps {
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  onContinue: () => void;
}

export function PersonaOrbCarousel({
  selectedRoleId,
  onSelectRole,
  onContinue
}: PersonaOrbCarouselProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter roles based on selected category tab
  const filteredRoles = activeTab === 'all' 
    ? TECH_ROLES 
    : TECH_ROLES.filter(r => r.category === activeTab);

  // Active index in filtered roles
  const activeIndex = Math.max(
    0,
    filteredRoles.findIndex(r => r.id === selectedRoleId)
  );

  // Fallback if selected role is empty or not in filtered list when switching tabs
  useEffect(() => {
    if (filteredRoles.length > 0 && (!selectedRoleId || !filteredRoles.some(r => r.id === selectedRoleId))) {
      onSelectRole(filteredRoles[0].id);
    }
  }, [activeTab, filteredRoles, selectedRoleId, onSelectRole]);

  const handlePrev = () => {
    if (filteredRoles.length === 0) return;
    const len = filteredRoles.length;
    const newIdx = (((activeIndex - 1) % len) + len) % len;
    if (filteredRoles[newIdx]) {
      onSelectRole(filteredRoles[newIdx].id);
    }
  };

  const handleNext = () => {
    if (filteredRoles.length === 0) return;
    const len = filteredRoles.length;
    const newIdx = (activeIndex + 1) % len;
    if (filteredRoles[newIdx]) {
      onSelectRole(filteredRoles[newIdx].id);
    }
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchEndX.current = clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 30;
    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isCarouselMode = filteredRoles.length >= 5;

  // Visible indices range [-3, -2, -1, 0, 1, 2, 3] with safe modulo wrapping for carousel mode
  const visibleOffsets = [-3, -2, -1, 0, 1, 2, 3];
  const visibleIndices = visibleOffsets
    .map(offset => {
      const len = filteredRoles.length;
      if (len === 0) return null;
      const rawIdx = (activeIndex + offset) % len;
      const wrappedIdx = (rawIdx + len) % len;
      return { offset, role: filteredRoles[wrappedIdx] };
    })
    .filter((item): item is { offset: number; role: TechRole } => item !== null && item.role !== undefined);

  const currentRole = filteredRoles[activeIndex] || filteredRoles[0] || TECH_ROLES[0];

  return (
    <div className="space-y-3.5 flex-1 flex flex-col justify-between">
      
      {/* 1. CATEGORY TABS (STABLE, NO ICON, NO BOUNCE SHAKE) */}
      <div className="flex items-center justify-between border-b border-[#efefef] pb-2.5 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 bg-[#f4f3f0] rounded-full border border-[#e8e7e3] shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-white text-[#121722] shadow-2xs border border-[#e4e3df]'
                    : 'text-[#777c86] hover:text-[#121722] border border-transparent'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block text-xs font-medium text-[#777c86]">
          {activeIndex + 1} of {filteredRoles.length} Evaluators
        </div>
      </div>

      {/* 2. MAIN CONTAINER */}
      <div 
        className="relative bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 sm:p-5 select-none overflow-hidden flex-1 min-h-[280px] flex flex-col justify-between my-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {isCarouselMode ? (
          /* Mode A: CAROUSEL MODE (5 or more items) */
          <>
            {/* Soft edge fade overlays */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#faf9f7] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#faf9f7] to-transparent z-10 pointer-events-none" />

            {/* ORBS CAROUSEL ROW */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4">
              {visibleIndices.map(({ offset, role }) => {
                const isCenter = offset === 0;
                const isAdjacent1 = Math.abs(offset) === 1;
                const isAdjacent2 = Math.abs(offset) === 2;
                const isAdjacent3 = Math.abs(offset) === 3;

                // Scale & Opacity setup
                let size = 115;
                let opacityClass = 'opacity-100 scale-100 z-20';
                let widthClass = 'w-32 sm:w-40';

                if (isAdjacent1) {
                  size = 80;
                  opacityClass = 'opacity-55 hover:opacity-90 transition-opacity cursor-pointer flex flex-col items-center';
                  widthClass = 'w-24 sm:w-32';
                } else if (isAdjacent2) {
                  size = 60;
                  opacityClass = 'opacity-35 hover:opacity-70 transition-opacity cursor-pointer hidden xs:flex flex-col items-center';
                  widthClass = 'w-18 sm:w-24';
                } else if (isAdjacent3) {
                  size = 45;
                  opacityClass = 'opacity-20 hover:opacity-50 transition-opacity cursor-pointer hidden lg:flex flex-col items-center';
                  widthClass = 'w-14 sm:w-18';
                }

                return (
                  <div
                    key={`${role.id}-${offset}`}
                    onClick={() => onSelectRole(role.id)}
                    className={`flex flex-col items-center justify-center ${widthClass} ${opacityClass}`}
                  >
                    {/* Avatar Circle */}
                    <div className="relative">
                      <AgentAvatar 
                        seed={role.id} 
                        size={size} 
                        animated={isCenter}
                        className={isCenter ? 'ring-[3px] ring-[#b8b4a7] ring-offset-2 ring-offset-[#faf9f7] rounded-full' : ''} 
                      />
                    </div>

                    {/* Text under inactive side options */}
                    {!isCenter && (
                      <div className="text-center mt-2 px-1">
                        <p className="text-xs font-semibold text-[#121722] truncate max-w-[100px]">
                          {role.label}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CENTER TITLE & DESCRIPTION WITH ARROWS */}
            <div className="mt-1 flex items-center justify-center gap-2 sm:gap-6 text-center max-w-xl mx-auto shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Evaluator"
                className="p-1.5 rounded-full hover:bg-black/5 text-[#777c86] hover:text-[#121722] transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex-1 px-2 min-w-0">
                <h4 className="text-base font-bold text-[#121722] flex items-center justify-center gap-1">
                  <span>{currentRole.label}</span>
                  <span className="text-xs text-[#777c86]">↗</span>
                </h4>
                <p className="text-xs text-[#777c86] mt-0.5 leading-snug max-w-md mx-auto truncate sm:whitespace-normal">
                  {currentRole.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Evaluator"
                className="p-1.5 rounded-full hover:bg-black/5 text-[#777c86] hover:text-[#121722] transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        ) : (
          /* Mode B: EQUAL SIZE GRID MODE (Less than 5 items) */
          <>
            <div className="flex-1 flex items-center justify-center gap-6 sm:gap-10">
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <div
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className={`flex flex-col items-center justify-center cursor-pointer transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="relative">
                      <AgentAvatar 
                        seed={role.id} 
                        size={95} 
                        animated={isSelected}
                        className={isSelected ? 'ring-[3px] ring-[#b8b4a7] ring-offset-2 ring-offset-[#faf9f7] rounded-full' : ''} 
                      />
                    </div>
                    <p className={`text-xs mt-2 text-center max-w-[120px] ${
                      isSelected ? 'font-bold text-[#121722]' : 'font-medium text-[#777c86]'
                    }`}>
                      {role.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* SELECTED ROLE DETAILS */}
            <div className="mt-1 text-center max-w-xl mx-auto shrink-0">
              <h4 className="text-base font-bold text-[#121722]">
                {currentRole.label}
              </h4>
              <p className="text-xs text-[#777c86] mt-0.5 leading-snug max-w-md mx-auto truncate sm:whitespace-normal">
                {currentRole.desc}
              </p>
            </div>
          </>
        )}
      </div>

      {/* FOOTER ACTION BUTTON */}
      <div className="pt-3 flex items-center justify-end mt-auto">
        <button
          type="button"
          onClick={onContinue}
          className="h-11 w-[260px] px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue to Upload CV</span>
        </button>
      </div>

    </div>
  );
}

export default PersonaOrbCarousel;
