import React from 'react';
import ReactECharts from 'echarts-for-react';
import { JobApplication, JobStatus, getStatusLabel } from '../types';
import { NoDataState } from './NoDataState';

interface SankeyChartProps {
  onAdd?: () => void;
  applications: JobApplication[];
  isDemo?: boolean;
  trackingSystem?: 'industry' | 'academic';
  onCategoryClick?: (status: JobStatus | 'Total') => void;
}

export function SankeyChart({ applications, isDemo = false, onAdd, trackingSystem = 'industry', onCategoryClick }: SankeyChartProps) {
  const total = applications.length;

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
  
  const counts: Record<string, number> = {
    'Applied': 0,
    'Screening': 0,
    'Technical': 0,
    'Final': 0,
    'Offer': 0,
    'Rejected': 0,
    'Ghosted': 0
  };

  applications.forEach(app => {
    if (counts[app.status] !== undefined) {
      counts[app.status]++;
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

  const nodes = [
    { name: totalLabel, itemStyle: { color: '#2b7fff', cursor: 'default' }, cursor: 'default' },
    { name: appliedLabel, itemStyle: { color: '#86efac', cursor: 'pointer' }, cursor: 'pointer' },
    { name: ghostedLabel, itemStyle: { color: '#cbd5e1', cursor: 'pointer' }, cursor: 'pointer' },
    { name: rejectedLabel, itemStyle: { color: '#fca5a5', cursor: 'pointer' }, cursor: 'pointer' },
    { name: screeningLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: technicalLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: finalLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
    { name: offerLabel, itemStyle: { color: '#8ec5ff', cursor: 'pointer' }, cursor: 'pointer' },
  ];

  const links: any[] = [];
  
  if (counts['Applied'] > 0) links.push({ source: totalLabel, target: appliedLabel, value: counts['Applied'] });
  if (counts['Ghosted'] > 0) links.push({ source: totalLabel, target: ghostedLabel, value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: totalLabel, target: rejectedLabel, value: counts['Rejected'] });
  
  if (reachedScreening > 0) links.push({ source: totalLabel, target: screeningLabel, value: reachedScreening });
  if (reachedTechnical > 0) links.push({ source: screeningLabel, target: technicalLabel, value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: technicalLabel, target: finalLabel, value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: finalLabel, target: offerLabel, value: reachedOffer });

  const activeNodes = new Set<string>();
  links.forEach(l => {
    activeNodes.add(l.source);
    activeNodes.add(l.target);
  });

  const filteredNodes = nodes.filter(n => activeNodes.has(n.name));

  const labelToStatusKey: Record<string, string> = {
    [appliedLabel]: 'Applied',
    [screeningLabel]: 'Screening',
    [technicalLabel]: 'Technical',
    [finalLabel]: 'Final',
    [offerLabel]: 'Offer',
    [ghostedLabel]: 'Ghosted',
    [rejectedLabel]: 'Rejected',
  };

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' },
      formatter: (params: any) => {
        if (!params) return '<div></div>';
        if (params.dataType === 'node') {
          const statusKey = labelToStatusKey[params.name];
          const count = params.name === totalLabel ? applications.length : (statusKey ? (counts[statusKey] || 0) : 0);
          return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:10px; height:10px; border-radius:50%; background-color:${params.color || '#3b82f6'};"></div><span style="color:#1e293b; font-weight:600; font-family: ui-sans-serif, system-ui, sans-serif;">${params.name || ''} : ${count}</span></div>`;
        }
        const source = params.data?.source || params.name || '';
        const target = params.data?.target || '';
        const val = params.data?.value ? ` (${params.data.value})` : '';
        return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:10px; height:10px; border-radius:50%; background-color:${params.color || '#94a3b8'};"></div><span style="color:#1e293b; font-weight:600; font-family: ui-sans-serif, system-ui, sans-serif;">${source}${target ? ` &rarr; ${target}` : ''}${val}</span></div>`;
      }
    },
    series: [
      {
        type: 'sankey',
        top: '5%',
        bottom: '5%',
        left: '5%',
        right: '15%',
        nodeAlign: 'left',
        data: filteredNodes,
        links: links,
        emphasis: {
          focus: 'adjacency'
        },
        levels: [
          {
            depth: 0,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 1,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 2,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 3,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          },
          {
            depth: 4,
            lineStyle: {
              color: 'target',
              opacity: 0.6
            }
          }
        ],
        lineStyle: {
          curveness: 0.5
        },
        label: {
          color: '#334155',
          fontSize: 13,
          fontWeight: 'bold',
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const statusKey = labelToStatusKey[params.name];
              const count = params.name === totalLabel ? applications.length : (statusKey ? (counts[statusKey] || 0) : 0);
              return `${params.name} (${count})`;
            }
            return `${params.name}: ${params.value}`;
          }
        }
      }
    ]
  };

  const onEvents = {
    click: (params: any) => {
      if (!params) return;
      if (params.dataType === 'node') {
        const nodeName = params.name;
        // Total applications area is not clickable
        if (nodeName === totalLabel) {
          return;
        }
        const statusKey = labelToStatusKey[nodeName];
        if (statusKey) {
          onCategoryClick?.(statusKey as JobStatus);
        }
      } else if (params.dataType === 'edge') {
        const targetName = params.data?.target;
        const statusKey = labelToStatusKey[targetName];
        if (statusKey) {
          onCategoryClick?.(statusKey as JobStatus);
        }
      }
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative">
        <div className="flex-1 w-full min-h-0 relative">
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            notMerge={true} 
            onEvents={onEvents}
          />
        </div>
      </div>
    </div>
  );
}
