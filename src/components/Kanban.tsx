import React, { useState } from 'react';
import { JobApplication, JobStatus } from '../types';
import { Calendar, Building, MoreVertical } from 'lucide-react';

const STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface KanbanProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (appId: string, status: JobStatus) => void;
}

export function Kanban({ applications, onEdit, onStatusChange }: KanbanProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const filteredApplications = applications.filter(app => {
    if (timeFilter === 'all') return true;
    if (!app.appliedDate) return false;
    
    const appliedTime = new Date(app.appliedDate).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (timeFilter === 'today') {
      return appliedTime >= today;
    }
    if (timeFilter === 'weekly') {
      const lastWeek = new Date(today - 7 * 24 * 60 * 60 * 1000).getTime();
      return appliedTime >= lastWeek;
    }
    if (timeFilter === 'monthly') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      return appliedTime >= lastMonth;
    }
    if (timeFilter === 'yearly') {
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
      return appliedTime >= lastYear;
    }
    if (timeFilter === 'custom') {
      const start = customStartDate ? new Date(customStartDate).getTime() : 0;
      const end = customEndDate ? new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
      return appliedTime >= start && appliedTime <= end;
    }
    return true;
  });

  const grouped = filteredApplications.reduce((acc, app) => {
    if (!acc[app.status]) acc[app.status] = [];
    acc[app.status].push(app);
    return acc;
  }, {} as Record<JobStatus, JobApplication[]>);

  const ACTIVE_STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer'];
  const INACTIVE_STATUSES: JobStatus[] = ['Rejected', 'Ghosted'];
  
  const displayStatuses = activeTab === 'active' ? ACTIVE_STATUSES : INACTIVE_STATUSES;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            Active Progress
          </button>
          <button 
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'inactive' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            Closed
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex gap-1 items-center">
            <Calendar size={14} className="text-slate-500 ml-2 mr-1" />
            <span className="text-xs font-bold text-slate-700 mr-2">Time:</span>
            {['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf as any)}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${timeFilter === tf ? 'bg-blue-100 text-blue-700' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1 mr-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">
        {displayStatuses.map(status => (
        <div key={status} className={`flex-shrink-0 w-[280px] lg:w-[calc(20%-13px)] xl:w-[calc(20%-13px)] lg:min-w-[150px] flex flex-col border-2 rounded-2xl p-5 shadow-sm snap-start ${status === 'Offer' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            const appId = e.dataTransfer.getData('text/plain');
            if (appId) onStatusChange(appId, status);
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">{status}</h3>
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 font-bold rounded-full border border-slate-200">
              {(grouped[status] || []).length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
            {(grouped[status] || []).map(app => (
              <div 
                key={app.id} 
                onClick={() => onEdit(app)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', app.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-sm cursor-grab active:cursor-grabbing"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-800 truncate pr-2">{app.position}</h4>
                  <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Building size={14} />
                  <span className="truncate">{app.company}</span>
                </div>
                {app.nextInterviewDate && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-100 w-fit px-2 py-1 rounded-full uppercase tracking-wider">
                    <Calendar size={12} />
                    <span>{new Date(app.nextInterviewDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
