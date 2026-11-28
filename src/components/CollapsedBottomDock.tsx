import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  ChevronRight,
  Download,
  FileText,
  FolderKanban,
  Globe,
  Layers,
  Layout,
  LayoutDashboard,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { auth } from '../lib/firebase';
import { Kbd } from './ui/kbd';
import { SlidingTabs } from './ui/sliding-tabs';
import {
  ExpandableTabs,
  type ExpandableTabSubOption,
  type ExpandableTabsItem,
} from './ui/expandable-tabs';
import type { OverviewSankeyTab } from './SankeyChart';

export type DockSubTabTarget =
  | { view: 'sankey'; tab: OverviewSankeyTab }
  | { view: 'kanban'; tab: 'active' | 'inactive' | 'wishlist' }
  | { view: 'cv-match' | 'eval-history' }
  | { view: 'company-intel'; tab: 'explorer' | 'history' }
  | { view: 'studio-cover-letter'; style: 'modern' | 'classic' | 'executive' }
  | { view: 'studio-resume'; tab: 'preview' | 'edit' };

export interface DockActiveTabsState {
  sankey: OverviewSankeyTab;
  kanban: 'active' | 'inactive' | 'wishlist';
  companyIntel: 'explorer' | 'history';
  coverLetterStyle: 'modern' | 'classic' | 'executive';
  resume: 'preview' | 'edit';
}

interface CollapsedBottomDockProps {
  activeId: string;
  activeTabs: DockActiveTabsState;
  onSelect: (id: string) => void;
  onSelectSubTab: (target: DockSubTabTarget) => void;
  onNew: () => void;
  onImport: () => void;
  onExport: () => void;
  onExpandSidebar: () => void;
  trackingSystem: 'industry' | 'academic';
  setTrackingSystem: (sys: 'industry' | 'academic') => void;
  applicationCount?: number;
  applicationCategoryCounts?: {
    active: number;
    inactive: number;
    wishlist: number;
  };
}

function DockRow({
  id,
  icon: Icon,
  label,
  active = false,
  badge,
  shortcut,
  subOptions,
  isExpanded = false,
  onHoverRow,
  onToggleExpand,
  onClick,
}: {
  id?: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number | string;
  shortcut?: string;
  subOptions?: ExpandableTabSubOption[];
  isExpanded?: boolean;
  onHoverRow?: (rowId: string | null) => void;
  onToggleExpand?: (rowId: string) => void;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  const hasSubOptions = !!subOptions && subOptions.length > 0;

  return (
    <div
      className="flex flex-col w-full"
      onMouseEnter={() => onHoverRow?.(hasSubOptions && id ? id : null)}
    >
      <div
        className="group flex w-full items-center rounded-xl transition-colors text-[#121722] font-medium hover:bg-[#faf9f7]"
      >
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 min-w-0 min-h-[38px] items-center gap-3 px-3 py-2 text-left text-[13px] cursor-pointer"
        >
          <Icon
            className="h-4 w-4 shrink-0 text-[#121722]"
            strokeWidth={active ? 2 : 1.75}
          />
          <span className="flex flex-1 min-w-0 items-center gap-2">
            {active && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9] shrink-0" />
            )}
            <span className="truncate font-medium text-[#121722]">
              {label}
            </span>
          </span>
          {shortcut && (
            <Kbd
              size="xs"
              className="text-[#777c86] font-mono text-[10px] bg-white border border-[#efefef] shadow-2xs"
            >
              {shortcut}
            </Kbd>
          )}
          {badge !== undefined && badge !== 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-[#e4e4e7] text-[#121722] tabular-nums">
              {badge}
            </span>
          )}
        </button>

        {hasSubOptions && (
          <button
            type="button"
            aria-label={`Show ${label} tab choices`}
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation();
              if (id) onToggleExpand?.(id);
            }}
            className="pr-2.5 pl-1 h-[38px] text-[#a5a5a5] hover:text-[#121722] cursor-pointer shrink-0 flex items-center"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded
                  ? 'rotate-90 text-[#121722]'
                  : 'opacity-75 group-hover:translate-x-0.5'
              }`}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasSubOptions && isExpanded && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-6 mr-1 mt-1 mb-1 pl-2.5 border-l border-[#efefef] flex flex-col gap-0.5">
              {subOptions!.map((opt) => (
                <button
                  key={opt.indexLabel ?? opt.label}
                  type="button"
                  onClick={opt.onClick}
                  className="group/sub flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[#121722] transition-colors cursor-pointer whitespace-nowrap hover:bg-[#faf9f7]"
                >
                  {opt.indexLabel && (
                    <span
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-[#efefef] bg-[#faf9f7] text-[10px] font-semibold tabular-nums text-[#121722] group-hover/sub:bg-white"
                    >
                      {opt.indexLabel}
                    </span>
                  )}
                  <span className="flex flex-1 min-w-0 items-center gap-2">
                    {opt.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9] shrink-0" />
                    )}
                    <span className="truncate text-[#121722]">{opt.label}</span>
                  </span>
                  {opt.badge !== undefined && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-[#e4e4e7] text-[#121722] tabular-nums shrink-0">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DockMenu({
  children,
  onClearHover,
}: {
  children: React.ReactNode;
  onClearHover?: () => void;
}) {
  return (
    <div
      onMouseLeave={() => onClearHover?.()}
      className="flex w-full min-w-[20.5rem] flex-col gap-0.5 p-0.5"
    >
      {children}
    </div>
  );
}

export function CollapsedBottomDock({
  activeId,
  activeTabs,
  onSelect,
  onSelectSubTab,
  onNew,
  onImport,
  onExport,
  onExpandSidebar,
  trackingSystem,
  setTrackingSystem,
  applicationCount,
  applicationCategoryCounts,
}: CollapsedBottomDockProps) {
  const [openTab, setOpenTab] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const rowCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setExpandedRowId(null);
  }, [openTab]);

  useEffect(() => {
    return () => {
      if (rowCloseTimerRef.current !== null) {
        window.clearTimeout(rowCloseTimerRef.current);
      }
    };
  }, []);

  const handleHoverRow = (rowId: string | null) => {
    if (rowCloseTimerRef.current !== null) {
      window.clearTimeout(rowCloseTimerRef.current);
      rowCloseTimerRef.current = null;
    }
    setExpandedRowId(rowId);
  };

  const handleClearRowHover = () => {
    if (rowCloseTimerRef.current !== null) {
      window.clearTimeout(rowCloseTimerRef.current);
    }
    rowCloseTimerRef.current = window.setTimeout(() => {
      setExpandedRowId(null);
    }, 120);
  };

  const handleToggleExpand = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const navigateAndClose = (id: string) => {
    onSelect(id);
    setOpenTab(null);
    setExpandedRowId(null);
  };

  const navigateSubAndClose = (target: DockSubTabTarget) => {
    onSelectSubTab(target);
    setOpenTab(null);
    setExpandedRowId(null);
  };

  const actionAndClose = (fn: () => void) => {
    fn();
    setOpenTab(null);
    setExpandedRowId(null);
  };

  const isAnon = auth.currentUser?.isAnonymous;
  const email = auth.currentUser?.email;
  let initial = 'U';
  let displayName = 'User';
  if (isAnon) {
    initial = 'G';
    displayName = 'Guest';
  } else if (email) {
    initial = email.charAt(0).toUpperCase();
    displayName = email.split('@')[0];
  }

  const items: ExpandableTabsItem[] = [
    {
      id: 'overview',
      kind: 'direct',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isDirectActive: activeId === 'sankey',
      onDirectClick: () => navigateSubAndClose({ view: 'sankey', tab: 'process' }),
    },
    {
      id: 'job-market',
      kind: 'direct',
      label: 'Job Market',
      icon: <Globe className="h-4 w-4" />,
      isDirectActive: activeId === 'global-market',
      onDirectClick: () => navigateAndClose('global-market'),
    },
    {
      id: 'tracker',
      kind: 'group',
      label: 'Tracker',
      icon: <FolderKanban className="h-4 w-4" />,
      hasCurrent: ['kanban', 'analytics'].includes(activeId),
      content: (
        <DockMenu onClearHover={handleClearRowHover}>
          <DockRow
            id="kanban"
            icon={FolderKanban}
            label="My Applications"
            active={activeId === 'kanban'}
            badge={applicationCount && applicationCount > 0 ? applicationCount : undefined}
            isExpanded={expandedRowId === 'kanban'}
            onHoverRow={handleHoverRow}
            onToggleExpand={handleToggleExpand}
            onClick={() => navigateAndClose('kanban')}
            subOptions={[
              {
                badge: applicationCategoryCounts?.active ?? 0,
                label: 'In Progress',
                active: activeId === 'kanban' && activeTabs.kanban === 'active',
                onClick: () =>
                  navigateSubAndClose({ view: 'kanban', tab: 'active' }),
              },
              {
                badge: applicationCategoryCounts?.inactive ?? 0,
                label: 'Closed',
                active:
                  activeId === 'kanban' && activeTabs.kanban === 'inactive',
                onClick: () =>
                  navigateSubAndClose({ view: 'kanban', tab: 'inactive' }),
              },
              {
                badge: applicationCategoryCounts?.wishlist ?? 0,
                label: 'Wishlist',
                active:
                  activeId === 'kanban' && activeTabs.kanban === 'wishlist',
                onClick: () =>
                  navigateSubAndClose({ view: 'kanban', tab: 'wishlist' }),
              },
            ]}
          />
          <DockRow
            id="analytics"
            icon={Activity}
            label="Analytics"
            active={activeId === 'analytics'}
            onHoverRow={handleHoverRow}
            onClick={() => navigateAndClose('analytics')}
          />
        </DockMenu>
      ),
    },
    {
      id: 'ai-evaluator',
      kind: 'direct',
      label: 'AI Evaluator',
      icon: <Sparkles className="h-4 w-4" />,
      isDirectActive: activeId === 'cv-match' || activeId === 'eval-history',
      onDirectClick: () => navigateAndClose('cv-match'),
    },
    {
      id: 'company-360',
      kind: 'direct',
      label: 'Company 360',
      icon: <Building2 className="h-4 w-4" />,
      isDirectActive: activeId === 'company-intel',
      onDirectClick: () =>
        navigateSubAndClose({ view: 'company-intel', tab: 'explorer' }),
    },
    {
      id: 'studios',
      kind: 'group',
      label: 'Studios',
      icon: <Layers className="h-4 w-4" />,
      hasCurrent: [
        'studio-cover-letter',
        'studio-interview-prep',
        'studio-personal-story',
        'studio-resume',
      ].includes(activeId),
      content: (
        <DockMenu onClearHover={handleClearRowHover}>
          <DockRow
            id="studio-cover-letter"
            icon={FileText}
            label="Cover Letter Studio"
            active={activeId === 'studio-cover-letter'}
            isExpanded={expandedRowId === 'studio-cover-letter'}
            onHoverRow={handleHoverRow}
            onToggleExpand={handleToggleExpand}
            onClick={() => navigateAndClose('studio-cover-letter')}
            subOptions={[
              {
                indexLabel: '1',
                label: 'Modern',
                active:
                  activeId === 'studio-cover-letter' &&
                  activeTabs.coverLetterStyle === 'modern',
                onClick: () =>
                  navigateSubAndClose({
                    view: 'studio-cover-letter',
                    style: 'modern',
                  }),
              },
              {
                indexLabel: '2',
                label: 'Classic',
                active:
                  activeId === 'studio-cover-letter' &&
                  activeTabs.coverLetterStyle === 'classic',
                onClick: () =>
                  navigateSubAndClose({
                    view: 'studio-cover-letter',
                    style: 'classic',
                  }),
              },
              {
                indexLabel: '3',
                label: 'Executive',
                active:
                  activeId === 'studio-cover-letter' &&
                  activeTabs.coverLetterStyle === 'executive',
                onClick: () =>
                  navigateSubAndClose({
                    view: 'studio-cover-letter',
                    style: 'executive',
                  }),
              },
            ]}
          />
          <DockRow
            id="studio-interview-prep"
            icon={BookOpen}
            label="Interview Prep Studio"
            active={
              activeId === 'studio-interview-prep' ||
              activeId === 'studio-personal-story'
            }
            onHoverRow={handleHoverRow}
            onClick={() => navigateAndClose('studio-interview-prep')}
          />
          <DockRow
            id="studio-resume"
            icon={Layout}
            label="Resume Studio"
            active={activeId === 'studio-resume'}
            isExpanded={expandedRowId === 'studio-resume'}
            onHoverRow={handleHoverRow}
            onToggleExpand={handleToggleExpand}
            onClick={() => navigateAndClose('studio-resume')}
            subOptions={[
              {
                indexLabel: '1',
                label: 'Live Preview',
                active:
                  activeId === 'studio-resume' &&
                  activeTabs.resume === 'preview',
                onClick: () =>
                  navigateSubAndClose({
                    view: 'studio-resume',
                    tab: 'preview',
                  }),
              },
              {
                indexLabel: '2',
                label: 'Edit Content',
                active:
                  activeId === 'studio-resume' && activeTabs.resume === 'edit',
                onClick: () =>
                  navigateSubAndClose({ view: 'studio-resume', tab: 'edit' }),
              },
            ]}
          />
        </DockMenu>
      ),
    },
    {
      id: 'workspace',
      kind: 'group',
      label: 'Actions',
      icon: <Plus className="h-4 w-4" />,
      content: (
        <DockMenu>
          <DockRow
            icon={Plus}
            label="New Application"
            shortcut="N"
            onClick={() => actionAndClose(onNew)}
          />
          <DockRow
            icon={Upload}
            label="Import Applications"
            onClick={() => actionAndClose(onImport)}
          />
          <DockRow
            icon={Download}
            label="Export Applications"
            onClick={() => actionAndClose(onExport)}
          />
        </DockMenu>
      ),
    },
    {
      id: 'account',
      kind: 'group',
      label: 'More',
      icon: <Settings className="h-4 w-4" />,
      hasCurrent: activeId === 'settings',
      content: (
        <DockMenu>
          <div className="px-1.5 pt-1 pb-1.5">
            <div className="text-[10px] font-bold tracking-wider text-[#a5a5a5] uppercase px-1 mb-1.5">
              I AM
            </div>
            <SlidingTabs<'industry' | 'academic'>
              value={trackingSystem}
              onChange={setTrackingSystem}
              ariaLabel="Tracking system"
              className="w-full"
              tabClassName="flex-1 px-2 text-xs"
              items={[
                { id: 'industry', label: 'Industry Seekr' },
                { id: 'academic', label: 'Academic Seekr' },
              ]}
            />
          </div>

          <DockRow
            icon={Settings}
            label="Settings"
            active={activeId === 'settings'}
            onClick={() => navigateAndClose('settings')}
          />

          <div className="flex items-center gap-2.5 px-3 pt-2 pb-1 mt-1 border-t border-[#efefef]">
            <div className="w-6 h-6 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center font-bold text-[11px] shrink-0">
              {initial}
            </div>
            <span className="text-[13px] font-medium text-[#121722] truncate capitalize">
              {displayName}
            </span>
          </div>
        </DockMenu>
      ),
    },
    {
      id: 'expand-sidebar',
      kind: 'direct',
      label: 'Expand Left Menu',
      icon: <PanelLeftOpen className="h-4 w-4" />,
      isDirectActive: false,
      onDirectClick: () => actionAndClose(onExpandSidebar),
    },
  ];

  return (
    <ExpandableTabs
      items={items}
      value={openTab}
      onValueChange={setOpenTab}
      className="shadow-[0_12px_36px_-8px_rgba(18,23,34,0.14)]"
    />
  );
}
