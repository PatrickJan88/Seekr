import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { JobApplication } from '../types';
import { Maximize2, Minimize2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SankeyChartProps {
  onAdd?: () => void;
  applications: JobApplication[];
  isDemo?: boolean;
}

export function SankeyChart({ applications, isDemo = false, onAdd }: SankeyChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const total = applications.length;

  if (total === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px] text-[#777c86] bg-white rounded-2xl border border-[#efefef]">
        <div className="mb-4 text-[14px] font-medium text-[#525866]">No data available for the overview.</div>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all bg-[#121722] text-white hover:bg-[#2b303b] px-5 py-2.5 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>New Application</span>
        </button>
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

  const nodes = [
    { name: 'Total Applications', itemStyle: { color: '#2b7fff' } },
    { name: 'Applied', itemStyle: { color: '#86efac' } },
    { name: 'Ghosted', itemStyle: { color: '#cbd5e1' } },
    { name: 'Rejected', itemStyle: { color: '#fca5a5' } },
    { name: 'Screening', itemStyle: { color: '#8ec5ff' } },
    { name: 'Technical', itemStyle: { color: '#8ec5ff' } },
    { name: 'Final', itemStyle: { color: '#8ec5ff' } },
    { name: 'Offer', itemStyle: { color: '#8ec5ff' } },
  ];

  const links: any[] = [];
  
  if (counts['Applied'] > 0) links.push({ source: 'Total Applications', target: 'Applied', value: counts['Applied'] });
  if (counts['Ghosted'] > 0) links.push({ source: 'Total Applications', target: 'Ghosted', value: counts['Ghosted'] });
  if (counts['Rejected'] > 0) links.push({ source: 'Total Applications', target: 'Rejected', value: counts['Rejected'] });
  
  if (reachedScreening > 0) links.push({ source: 'Total Applications', target: 'Screening', value: reachedScreening });
  if (reachedTechnical > 0) links.push({ source: 'Screening', target: 'Technical', value: reachedTechnical });
  if (reachedFinal > 0) links.push({ source: 'Technical', target: 'Final', value: reachedFinal });
  if (reachedOffer > 0) links.push({ source: 'Final', target: 'Offer', value: reachedOffer });

  const activeNodes = new Set<string>();
  links.forEach(l => {
    activeNodes.add(l.source);
    activeNodes.add(l.target);
  });

  const filteredNodes = nodes.filter(n => activeNodes.has(n.name));

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
          const category = params.name === 'Applied' ? 'Applied' : params.name;
          const count = category === 'Total Applications' ? applications.length : (counts[category as keyof typeof counts] || 0);
          return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background-color:${params.color || '#3b82f6'};"></div><span style="color:#1e293b; font-weight:500; font-family: ui-sans-serif, system-ui, sans-serif;">${params.name || ''} : ${count}</span></div>`;
        }
        const source = params.data?.source || params.name || '';
        const target = params.data?.target || '';
        return `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background-color:${params.color || '#94a3b8'};"></div><span style="color:#1e293b; font-weight:500; font-family: ui-sans-serif, system-ui, sans-serif;">${source}${target ? ` &rarr; ${target}` : ''}</span></div>`;
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
              const category = params.name === 'Applied' ? 'Applied' : params.name;
              const count = category === 'Total Applications' ? applications.length : (counts[category as keyof typeof counts] || 0);
              return `${params.name} (${count})`;
            }
            return `${params.name}: ${params.value}`;
          }
        }
      }
    ]
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-[#121722]/80 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center items-center overflow-auto" : "relative w-full flex-1 flex flex-col min-h-[500px]"}>
      <div className={`bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full ${isFullscreen ? 'max-w-7xl h-[92vh] overflow-hidden' : 'flex-1 min-h-[500px] flex flex-col'} relative`}>
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={() => {
              if (isDemo) {
                toast.info('Demo Mode: Full screen view is disabled in this portfolio preview.');
                return;
              }
              setIsFullscreen(!isFullscreen);
            }}
            className={`inline-flex items-center justify-center rounded-full text-sm font-medium transition-all border border-[#efefef] bg-white text-[#777c86] hover:bg-[#faf9f7] hover:text-[#121722] h-10 w-10 p-0 cursor-pointer shadow-2xs ${isDemo ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isDemo ? "Full screen disabled in Demo Mode" : isFullscreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
        <div className="flex-1 w-full min-h-0 relative">
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge={true} />
        </div>
      </div>
    </div>
  );
}
