import React from 'react';
import { JobApplication, JobStatus, getStatusLabel } from '../types';
import { ApplicationMap } from './ApplicationMap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsProps {
  applications: JobApplication[];
  isDemo?: boolean;
  onLocationSelect?: (country: string | null) => void;
  trackingSystem?: 'industry' | 'academic';
}

export function Analytics({ applications, isDemo = false, onLocationSelect, trackingSystem = 'industry' }: AnalyticsProps) {
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<JobStatus, number>);

  const funnelData = [
    { name: getStatusLabel('Applied', trackingSystem), count: statusCounts['Applied'] || 0 },
    { name: getStatusLabel('Screening', trackingSystem), count: statusCounts['Screening'] || 0 },
    { name: getStatusLabel('Technical', trackingSystem), count: statusCounts['Technical'] || 0 },
    { name: getStatusLabel('Final', trackingSystem), count: statusCounts['Final'] || 0 },
    { name: getStatusLabel('Offer', trackingSystem), count: statusCounts['Offer'] || 0 },
  ];

  const pieData = Object.entries(statusCounts).map(([statusKey, value]) => ({ 
    name: getStatusLabel(statusKey, trackingSystem), 
    rawStatus: statusKey,
    value 
  }));
  
  const statusColors: Record<string, string> = {
    'Wishlist': '#fbbf24',
    'Applied': '#0068f9',
    'Ghosted': '#94a3b8',
    'Rejected': '#ef4444',
    'Screening': '#38bdf8',
    'Technical': '#60a5fa',
    'Final': '#93c5fd',
    'Offer': '#22c55e'
  };

  const getStatusColor = (labelOrKey: string) => {
    if (statusColors[labelOrKey]) return statusColors[labelOrKey];
    // Map academic labels back to colors
    if (labelOrKey === getStatusLabel('Applied', 'academic')) return statusColors['Applied'];
    if (labelOrKey === getStatusLabel('Screening', 'academic')) return statusColors['Screening'];
    if (labelOrKey === getStatusLabel('Technical', 'academic')) return statusColors['Technical'];
    if (labelOrKey === getStatusLabel('Final', 'academic')) return statusColors['Final'];
    if (labelOrKey === getStatusLabel('Offer', 'academic')) return statusColors['Offer'];
    return '#0068f9';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0]) {
      const item = payload[0];
      const name = item.name || item.payload?.name || '';
      const value = item.value ?? 0;
      const color = getStatusColor(name) || item.color || '#0068f9';

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

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-12 gap-6 w-full">
      <div className="col-span-12">
        <ApplicationMap applications={applications} isDemo={isDemo} onLocationSelect={onLocationSelect} />
      </div>

      <div className="col-span-12 md:col-span-8 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none flex flex-col">
        <h3 className="text-sm font-bold text-[#121722] mb-4">Active Progress Summary</h3>
        <div className="h-72 flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#efefef" />
              <XAxis type="number" allowDecimals={false} tick={{fill: '#777c86', fontSize: 12}} />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#121722', fontSize: 12, fontWeight: 'medium'}} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="#0068f9" radius={[0, 8, 8, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 bg-[#121722] border border-[#121722] rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Current Status</h3>
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
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.rawStatus || entry.name)} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-sm text-slate-300 leading-relaxed text-center font-normal">
          Active distribution across <span className="text-white font-bold">{applications.length}</span> total roles.
        </div>
        </div>
      </div>
    </div>
  </div>
  );
}
