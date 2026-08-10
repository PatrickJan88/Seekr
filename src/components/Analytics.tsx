import React, { useState } from 'react';
import { JobApplication, JobStatus } from '../types';
import { ApplicationMap } from './ApplicationMap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsProps {
  applications: JobApplication[];
}

export function Analytics({ applications }: AnalyticsProps) {
  const [linkedinViews, setLinkedinViews] = useState('');
  const [linkedinSearches, setLinkedinSearches] = useState('');
  const [savedInsights, setSavedInsights] = useState<{views: number, searches: number} | null>(null);

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<JobStatus, number>);

  const funnelData = [
    { name: 'Applied', count: statusCounts['Applied'] || 0 },
    { name: 'Screening', count: statusCounts['Screening'] || 0 },
    { name: 'Technical', count: statusCounts['Technical'] || 0 },
    { name: 'Final', count: statusCounts['Final'] || 0 },
    { name: 'Offer', count: statusCounts['Offer'] || 0 },
  ];

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  const statusColors: Record<string, string> = {
    'Applied': '#86efac',
    'Ghosted': '#cbd5e1',
    'Rejected': '#fca5a5',
    'Screening': '#8ec5ff',
    'Technical': '#8ec5ff',
    'Final': '#8ec5ff',
    'Offer': '#8ec5ff'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0]) {
      const item = payload[0];
      const name = item.name || item.payload?.name || '';
      const value = item.value ?? 0;
      const color = statusColors[name] || item.color || '#3b82f6';

      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-slate-800 font-medium">{name} : {value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSaveInsights = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedInsights({
      views: parseInt(linkedinViews) || 0,
      searches: parseInt(linkedinSearches) || 0
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <ApplicationMap applications={applications} />
      </div>

      <div className="col-span-12 md:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Active Progress Summary</h3>
        <div className="h-72 flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#475569', fontSize: 12, fontWeight: 'bold'}} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 bg-[#314158] border border-[#314158] rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 mb-4">Current Status</h3>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-sm text-slate-300 leading-relaxed text-center">
          Active distribution across <span className="text-white font-bold">{applications.length}</span> total roles.
        </div>
      </div>

      <div className="col-span-12 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">LinkedIn Premium Insights</h3>
        {!savedInsights ? (
          <form onSubmit={handleSaveInsights} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Profile Views (90 Days)</label>
              <input type="number" value={linkedinViews} onChange={e => setLinkedinViews(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="e.g. 1500" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Search Appearances</label>
              <input type="number" value={linkedinSearches} onChange={e => setLinkedinSearches(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="e.g. 450" />
            </div>
            <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2 w-full md:w-auto">
              Save Insights
            </button>
          </form>
        ) : (
          <div className="flex gap-12 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Profile Views</div>
              <div className="text-3xl font-black text-slate-800">{savedInsights.views}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Search Appearances</div>
              <div className="text-3xl font-black text-slate-800">{savedInsights.searches}</div>
            </div>
            <button onClick={() => setSavedInsights(null)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2 mt-auto ml-auto">
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
