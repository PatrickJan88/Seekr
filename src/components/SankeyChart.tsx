import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { JobApplication, JobStatus, getStatusLabel, toCanonicalStatus } from '../types';
import { NoDataState } from './NoDataState';
import { buildIndustryRoleSummary, IndustryRoleLink, IndustryRoleNode } from '../lib/sankeyClassification';
import { SlidingTabs } from './ui/sliding-tabs';

export type OverviewSankeyTab = 'process' | 'industries-roles';

export interface OverviewIndustryRoleFilter {
  label: string;
  applicationIds: string[];
}

interface SankeyChartProps {
  onAdd?: () => void;
  applications: JobApplication[];
  isDemo?: boolean;
  trackingSystem?: 'industry' | 'academic';
  onCategoryClick?: (status: JobStatus | 'Total') => void;
  onIndustryRoleClick?: (filter: OverviewIndustryRoleFilter) => void;
  requestedTab?: { tab: OverviewSankeyTab; seq: number } | null;
  onTabChange?: (tab: OverviewSankeyTab) => void;
}

export function SankeyChart({
  applications,
  isDemo = false,
  onAdd,
  trackingSystem = 'industry',
  onCategoryClick,
  onIndustryRoleClick,
  requestedTab = null,
  onTabChange,
}: SankeyChartProps) {
  const [activeTab, setActiveTab] = useState<OverviewSankeyTab>(() => requestedTab?.tab || 'process');

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab.tab);
    }
  }, [requestedTab?.seq]);

  const handleTabChange = (tab: OverviewSankeyTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const total = applications.length;

  const industryRoleSummary = useMemo(
    () => buildIndustryRoleSummary(applications, trackingSystem),
    [applications, trackingSystem]
  );

  // Preserve exact empty state for new users with no data
  if (total === 0) {
    return (
      <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col justify-center items-center relative animate-in fade-in duration-300">
          <NoDataState
            icon="/icons/dashboard.svg"
            alt="Tracking your first application"
            title="Tracking your first application"
            actionText="New Application"
            onAction={onAdd}
          />
        </div>
      </div>
    );
  }

  // --- Process Sankey Data ---
  const counts: Record<string, number> = {
    Applied: 0,
    Screening: 0,
    Technical: 0,
    Final: 0,
    Offer: 0,
    Rejected: 0,
    Ghosted: 0,
  };

  applications.forEach((app) => {
    const canon = toCanonicalStatus(app.status);
    if (counts[canon] !== undefined) {
      counts[canon]++;
    }
  });

  const reachedScreening = counts['Screening'] + counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedTechnical = counts['Technical'] + counts['Final'] + counts['Offer'];
  const reachedFinal = counts['Final'] + counts['Offer'];
  const reachedOffer = counts['Offer'];

  const appliedLabel = getStatusLabel('Applied', trackingSystem);
  const screeningLabel = getStatusLabel('Screening', trackingSystem);
  const technicalLabel = getStatusLabel('Technical', trackingSystem);
  const finalLabel = getStatusLabel('Final', trackingSystem);
  const offerLabel = getStatusLabel('Offer', trackingSystem);
  const ghostedLabel = getStatusLabel('Ghosted', trackingSystem);
  const rejectedLabel = getStatusLabel('Rejected', trackingSystem);
  const totalLabel = trackingSystem === 'academic' ? 'Total Submissions' : 'Total Applications';

  const processNodes = [
    { name: totalLabel, itemStyle: { color: '#2b7fff', cursor: 'default' }, cursor: 'default' },
    { name: appliedLabel, itemStyle: { color: '#86efac', cursor: 'pointer' }, cursor: 'pointer' },
    { name: ghostedLabel, itemStyle: { color: '#cbd5e1', cursor: 'pointer' }, cursor: 'pointer' },
    { name: rejectedLabel, itemStyle: { color: '#fca5a5', cursor: 'pointer' }, cursor: 'pointer' },
    { name: screeningLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: technicalLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: finalLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: offerLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
  ];

  const processLinks: any[] = [];
  if (counts['Applied'] > 0) processLinks.push({ source: totalLabel, target: appliedLabel, value: counts['Applied'] });
  if (counts['Ghosted'] > 0) processLinks.push({ source: totalLabel, target: ghostedLabel, value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) processLinks.push({ source: totalLabel, target: rejectedLabel, value: counts['Rejected'] });

  if (reachedScreening > 0) processLinks.push({ source: totalLabel, target: screeningLabel, value: reachedScreening });
  if (reachedTechnical > 0) processLinks.push({ source: screeningLabel, target: technicalLabel, value: reachedTechnical });
  if (reachedFinal > 0) processLinks.push({ source: technicalLabel, target: finalLabel, value: reachedFinal });
  if (reachedOffer > 0) processLinks.push({ source: finalLabel, target: offerLabel, value: reachedOffer });

  const activeProcessNodes = new Set<string>();
  processLinks.forEach((l) => {
    activeProcessNodes.add(l.source);
    activeProcessNodes.add(l.target);
  });

  const filteredProcessNodes = processNodes.filter((n) => activeProcessNodes.has(n.name));

  const resolveStatus = (name?: string): JobStatus | null => {
    if (!name) return null;
    const trimmed = String(name).trim();
    if (trimmed === totalLabel || trimmed === 'Total Applications' || trimmed === 'Total Submissions') {
      return null;
    }
    return toCanonicalStatus(trimmed);
  };

  const labelToStatusKey: Record<string, string> = {
    [appliedLabel]: 'Applied',
    [screeningLabel]: 'Screening',
    [technicalLabel]: 'Technical',
    [finalLabel]: 'Final',
    [offerLabel]: 'Offer',
    [ghostedLabel]: 'Ghosted',
    [rejectedLabel]: 'Rejected',
  };

  const processOption = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: '#ffffff',
      borderColor: '#efefef',
      borderWidth: 1,
      textStyle: { color: '#121722' },
      formatter: (params: any) => {
        if (!params) return '<div></div>';
        if (params.dataType === 'node') {
          const statusKey = labelToStatusKey[params.name];
          const count = params.name === totalLabel ? applications.length : statusKey ? counts[statusKey] || 0 : 0;
          return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:10px; height:10px; border-radius:50%; background-color:${params.color || '#0068f9'};"></div><span style="color:#121722; font-weight:600; font-family: var(--font-roobert), ui-sans-serif, system-ui, sans-serif;">${params.name || ''} : ${count}</span></div>`;
        }
        const source = params.data?.source || params.name || '';
        const target = params.data?.target || '';
        const val = params.data?.value ? ` (${params.data.value})` : '';
        return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:10px; height:10px; border-radius:50%; background-color:${params.color || '#94a3b8'};"></div><span style="color:#121722; font-weight:600; font-family: var(--font-roobert), ui-sans-serif, system-ui, sans-serif;">${source}${target ? ` &rarr; ${target}` : ''}${val}</span></div>`;
      },
    },
    series: [
      {
        type: 'sankey',
        top: '5%',
        bottom: '5%',
        left: '5%',
        right: '15%',
        nodeAlign: 'left',
        data: filteredProcessNodes,
        links: processLinks,
        emphasis: {
          focus: 'adjacency',
        },
        levels: [
          { depth: 0, lineStyle: { color: 'target', opacity: 0.6 } },
          { depth: 1, lineStyle: { color: 'target', opacity: 0.6 } },
          { depth: 2, lineStyle: { color: 'target', opacity: 0.6 } },
          { depth: 3, lineStyle: { color: 'target', opacity: 0.6 } },
          { depth: 4, lineStyle: { color: 'target', opacity: 0.6 } },
        ],
        lineStyle: {
          curveness: 0.5,
        },
        label: {
          color: '#121722',
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textBorderWidth: 0,
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const statusKey = labelToStatusKey[params.name];
              const count = params.name === totalLabel ? applications.length : statusKey ? counts[statusKey] || 0 : 0;
              return `${params.name} (${count})`;
            }
            return `${params.name}: ${params.value}`;
          },
        },
      },
    ],
  };

  const processEvents = {
    click: (params: any) => {
      if (!params) return;
      if (params.dataType === 'node') {
        const nodeName = params.name || params.data?.name;
        if (nodeName === totalLabel) {
          return;
        }
        const statusKey = resolveStatus(nodeName);
        if (statusKey) {
          onCategoryClick?.(statusKey);
        }
      } else if (params.dataType === 'edge') {
        const targetName = params.data?.target;
        const sourceName = params.data?.source;
        const statusKey = resolveStatus(targetName) || resolveStatus(sourceName);
        if (statusKey) {
          onCategoryClick?.(statusKey);
        }
      }
    },
  };

  // --- Industries & Roles Sankey Data ---
  const nodeLookup = new Map<string, IndustryRoleNode>();
  industryRoleSummary.industries.forEach((n) => nodeLookup.set(n.id, n));
  industryRoleSummary.functions.forEach((n) => nodeLookup.set(n.id, n));

  const linkLookup = new Map<string, IndustryRoleLink>();
  industryRoleSummary.links.forEach((l) => linkLookup.set(`${l.sourceId}__${l.targetId}`, l));

  const industryRoleNodes = [
    ...industryRoleSummary.industries.map((ind) => ({
      name: ind.id,
      depth: 0,
      itemStyle: { color: ind.color, borderWidth: 0, cursor: 'pointer' },
      cursor: 'pointer',
      label: {
        position: 'left',
        align: 'right',
        distance: 10,
      },
    })),
    ...industryRoleSummary.functions.map((fn) => ({
      name: fn.id,
      depth: 1,
      itemStyle: { color: fn.color, borderWidth: 0, cursor: 'pointer' },
      cursor: 'pointer',
      label: {
        position: 'right',
        align: 'left',
        distance: 10,
      },
    })),
  ];

  const industryRoleLinks = industryRoleSummary.links.map((link) => {
    const hasOffer = link.breakdown.offer > 0;
    const isAllOffer = hasOffer && link.breakdown.offer === link.value;
    const sourceNode = nodeLookup.get(link.sourceId);

    return {
      source: link.sourceId,
      target: link.targetId,
      value: link.value,
      lineStyle: isAllOffer
        ? { color: '#fbbf24', opacity: 0.72, curveness: 0.48 }
        : hasOffer
        ? { color: sourceNode?.color || '#0068f9', opacity: 0.56, borderColor: '#f59e0b', borderWidth: 1, curveness: 0.48 }
        : { color: 'source', opacity: 0.42, curveness: 0.48 },
    };
  });

  const formatBreakdownParts = (b: { active: number; offer: number; rejected: number; ghosted: number }) => {
    const parts: string[] = [];
    if (b.active > 0) parts.push(`In Progress: ${b.active}`);
    if (b.offer > 0) parts.push(`<span style="color:#b45309;font-weight:600;">Offers: ${b.offer}</span>`);
    if (b.rejected > 0) parts.push(`Rejected: ${b.rejected}`);
    if (b.ghosted > 0) parts.push(`Ghosted: ${b.ghosted}`);
    return parts.join(' &middot; ');
  };

  const industryRoleOption = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: '#ffffff',
      borderColor: '#efefef',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#121722' },
      formatter: (params: any) => {
        if (!params) return '';
        if (params.dataType === 'node') {
          const node = nodeLookup.get(params.name);
          if (!node) return '';
          const details = formatBreakdownParts(node.breakdown);
          return `
            <div style="font-family: var(--font-roobert), ui-sans-serif, system-ui, sans-serif;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="width:9px; height:9px; border-radius:50%; background-color:${node.color}; display:inline-block;"></span>
                <span style="font-weight:700; color:#121722; font-size:15px;">${node.label}</span>
                <span style="font-weight:700; color:#0068f9; font-size:15px; margin-left:4px;">${node.breakdown.total}</span>
              </div>
              <div style="font-size:13.5px; color:#777c86;">${details}</div>
            </div>
          `;
        }
        if (params.dataType === 'edge') {
          const link = linkLookup.get(`${params.data?.source}__${params.data?.target}`);
          if (!link) return '';
          const details = formatBreakdownParts(link.breakdown);
          const sourceColor = nodeLookup.get(link.sourceId)?.color || '#0068f9';
          return `
            <div style="font-family: var(--font-roobert), ui-sans-serif, system-ui, sans-serif;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="width:9px; height:9px; border-radius:50%; background-color:${link.breakdown.offer > 0 ? '#fbbf24' : sourceColor}; display:inline-block;"></span>
                <span style="font-weight:700; color:#121722; font-size:14.5px;">${link.sourceLabel} &rarr; ${link.targetLabel}</span>
                <span style="font-weight:700; color:#0068f9; font-size:15px; margin-left:4px;">${link.value}</span>
              </div>
              <div style="font-size:13.5px; color:#777c86;">${details}</div>
            </div>
          `;
        }
        return '';
      },
    },
    series: [
      {
        type: 'sankey',
        top: '5%',
        bottom: '5%',
        left: 235,
        right: 215,
        nodeWidth: 14,
        nodeGap: 18,
        layoutIterations: 0,
        draggable: false,
        data: industryRoleNodes,
        links: industryRoleLinks,
        emphasis: {
          focus: 'adjacency',
        },
        label: {
          color: '#121722',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textBorderWidth: 0,
          formatter: (params: any) => {
            const node = nodeLookup.get(params.name);
            if (!node) return params.name;
            if (node.side === 'industry') {
              return `{count|${node.breakdown.total}}  {ind|${node.label}}`;
            }
            if (node.breakdown.offer > 0) {
              const offerText = node.breakdown.offer === 1 ? '1 Offer' : `${node.breakdown.offer} Offers`;
              return `{count|${node.breakdown.total}}  {name|${node.label}}  {offer|${offerText}}`;
            }
            return `{count|${node.breakdown.total}}  {name|${node.label}}`;
          },
          rich: {
            ind: {
              color: '#121722',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textBorderWidth: 0,
            },
            count: {
              color: '#121722',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textBorderWidth: 0,
            },
            name: {
              color: '#121722',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textBorderWidth: 0,
            },
            offer: {
              color: '#b45309',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textBorderWidth: 0,
              padding: [0, 0, 0, 4],
            },
          },
        },
      },
    ],
  };

  const industryRoleEvents = {
    click: (params: any) => {
      if (!params || !onIndustryRoleClick) return;
      if (params.dataType === 'node') {
        const node = nodeLookup.get(params.name);
        if (node && node.applicationIds.length > 0) {
          onIndustryRoleClick({
            label: `${node.label} (${node.breakdown.total})`,
            applicationIds: node.applicationIds,
          });
        }
      } else if (params.dataType === 'edge') {
        const link = linkLookup.get(`${params.data?.source}__${params.data?.target}`);
        if (link && link.applicationIds.length > 0) {
          onIndustryRoleClick({
            label: `${link.sourceLabel} / ${link.targetLabel} (${link.value})`,
            applicationIds: link.applicationIds,
          });
        }
      }
    },
  };

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative gap-4">
        {/* Top Row: Company 360 Pill Tabs + Aligned Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <SlidingTabs<OverviewSankeyTab>
            value={activeTab}
            onChange={handleTabChange}
            useTabRoles
            ariaLabel="Overview Chart Views"
            tabClassName="px-4"
            items={[
              { id: 'process', label: 'Application Process' },
              { id: 'industries-roles', label: 'Industries & Roles' },
            ]}
          />

          {activeTab === 'industries-roles' && industryRoleSummary.totalApplied > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#777c86] tabular-nums">
              <span>
                <strong className="font-semibold text-[#121722]">{industryRoleSummary.totalApplied}</strong> Applied
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>
                <strong className="font-semibold text-[#121722]">{industryRoleSummary.ghostedCount}</strong> Ghosted
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>
                <strong className="font-semibold text-[#121722]">{industryRoleSummary.rejectedCount}</strong> Rejected
              </span>
              {industryRoleSummary.offerCount > 0 && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span className="text-[#b45309]">
                    <strong className="font-semibold">{industryRoleSummary.offerCount}</strong>{' '}
                    {industryRoleSummary.offerCount === 1 ? 'Offer' : 'Offers'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Chart Viewport */}
        {activeTab === 'process' ? (
          <div className="flex-1 w-full min-h-0 relative">
            <ReactECharts
              option={processOption}
              opts={{ renderer: 'svg' }}
              style={{ height: '100%', width: '100%' }}
              notMerge={true}
              onEvents={processEvents}
            />
          </div>
        ) : industryRoleSummary.totalApplied === 0 ? (
          <div className="flex-1 w-full min-h-[380px] flex flex-col items-center justify-center">
            <NoDataState
              icon="/icons/dashboard.svg"
              alt="No submitted applications yet"
              title="No submitted applications yet"
              description="Move saved roles from Wishlist to Applied to view your employer industry and job function breakdown."
            />
          </div>
        ) : (
          <div className="flex-1 w-full min-h-0 flex flex-col overflow-x-auto custom-scrollbar">
            <div className="min-w-[820px] w-full flex-1 flex flex-col min-h-[400px]">
              {/* Left small title aligned with tab text (22px = track p-1 + borders + px-4), right title flush with summary */}
              <div className="flex items-center justify-between pl-[22px] pb-1 shrink-0 select-none">
                <span className="text-[13px] font-semibold text-[#777c86]">
                  Employer industry
                </span>
                <span className="text-[13px] font-semibold text-[#777c86]">
                  Job function
                </span>
              </div>

              <div className="flex-1 w-full min-h-0 relative">
                <ReactECharts
                  option={industryRoleOption}
                  opts={{ renderer: 'svg' }}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  onEvents={industryRoleEvents}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
