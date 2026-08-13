import React, { useState } from 'react';
import { JobApplication, JobStatus, getWorkTypeBadgeStyle } from '../types';
import { Calendar, Building, MoreVertical, LayoutDashboard, List } from 'lucide-react';
import { ListView } from './ListView';

const STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface KanbanProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (appId: string, status: JobStatus) => void;
  onDelete: (appId: string) => void;
}

export function Kanban({ applications, onEdit, onStatusChange, onDelete }: KanbanProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [layoutMode, setLayoutMode] = useState<'kanban' | 'list'>('kanban');
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
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer ${activeTab === 'active' ? 'bg-white text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent hover:bg-[#faf9f7]'}`}
          >
            Active Progress
          </button>
          <button 
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer ${activeTab === 'inactive' ? 'bg-white text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent hover:bg-[#faf9f7]'}`}
          >
            Closed
          </button>
        </div>
        
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-4 bg-white border border-[#efefef] rounded-2xl p-1.5 shadow-2xs overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex gap-1 items-center">
            <Calendar size={14} className="text-[#777c86] ml-2 mr-1" />
            <span className="text-xs font-semibold text-[#121722] mr-2">Time:</span>
            {['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf as any)}
                className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all cursor-pointer ${timeFilter === tf ? 'bg-[#faf9f7] text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent'}`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 border-l border-[#efefef] pl-3 ml-1 mr-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs border border-[#efefef] rounded-full px-3 py-1 bg-[#faf9f7] focus:outline-none focus:ring-1 focus:ring-[#0068f9] text-[#121722]"
              />
              <span className="text-[#777c86] text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs border border-[#efefef] rounded-full px-3 py-1 bg-[#faf9f7] focus:outline-none focus:ring-1 focus:ring-[#0068f9] text-[#121722]"
              />
            </div>
          )}
        
        </div>
          <div className="flex items-center gap-1 bg-white border border-[#efefef] rounded-2xl p-1.5 shadow-2xs">
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${layoutMode === 'kanban' ? 'bg-[#faf9f7] text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent'}`}
              title="Kanban View"
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${layoutMode === 'list' ? 'bg-[#faf9f7] text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent'}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      {layoutMode === 'kanban' ? (
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">
        {displayStatuses.map(status => (
        <div key={status} className={`flex-shrink-0 w-[280px] lg:w-[calc(20%-13px)] xl:w-[calc(20%-13px)] lg:min-w-[150px] flex flex-col border rounded-2xl p-4 shadow-2xs snap-start ${status === 'Offer' ? 'bg-[#faf9f7] border-[#0068f9]/30' : 'bg-white border-[#efefef]'}`}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            const appId = e.dataTransfer.getData('text/plain');
            if (appId) onStatusChange(appId, status);
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#121722]">{status}</h3>
            <span className="bg-[#faf9f7] text-[#121722] text-xs px-2.5 py-0.5 font-semibold rounded-full border border-[#efefef]">
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
                className="p-4 border border-[#efefef] rounded-2xl bg-[#faf9f7] hover:border-[#0068f9]/40 hover:bg-white transition-all cursor-pointer group shadow-2xs cursor-grab active:cursor-grabbing"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-[#121722] truncate pr-2">{app.position}</h4>
                  <button className="text-[#777c86] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#121722]">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#777c86] mb-3 flex-wrap">
                  <span className="truncate">{app.company}</span>
                  {app.location && (
                    <span className="text-[11px] text-[#777c86] font-medium truncate">
                      • {app.location}
                    </span>
                  )}
                  {app.workType && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${getWorkTypeBadgeStyle(app.workType)}`}>
                      {app.workType}
                    </span>
                  )}
                </div>
                {app.nextInterviewDate && (
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[#0068f9] bg-[#faf9f7] border border-[#efefef] w-fit px-2.5 py-1 rounded-full">
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
      ) : (
        <ListView applications={filteredApplications.filter(app => displayStatuses.includes(app.status))} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} />
      )}
    </div>
  );
}
