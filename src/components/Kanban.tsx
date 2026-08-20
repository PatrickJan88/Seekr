import React, { useState, useMemo } from 'react';
import { JobApplication, JobStatus, getWorkTypeBadgeStyle } from '../types';
import { Calendar, Building, MoreVertical, LayoutDashboard, List, MapPin, X, Info } from 'lucide-react';
import { ListView } from './ListView';
import { matchLocation } from './ApplicationMap';
import { Dropdown } from './ui/Dropdown';

const STATUSES: JobStatus[] = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface KanbanProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (appId: string, status: JobStatus) => void;
  onDelete: (appId: string) => void;
  locationFilter?: string | null;
  onLocationSelect?: (country: string | null) => void;
}

export function Kanban({ applications, onEdit, onStatusChange, onDelete, locationFilter = null, onLocationSelect }: KanbanProps) {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'active' | 'inactive'>('active');
  const [layoutMode, setLayoutMode] = useState<'kanban' | 'list'>('kanban');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    applications.forEach(app => {
      const match = matchLocation(app.location, `${app.company || ''} ${app.notes || ''}`);
      if (match) countries.add(match.country);
    });
    return Array.from(countries).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // 1. Time Filter
      let passTime = true;
      if (timeFilter !== 'all') {
        if (!app.appliedDate) {
          passTime = false;
        } else {
          const appliedTime = new Date(app.appliedDate).getTime();
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          
          if (timeFilter === 'today') passTime = appliedTime >= today;
          else if (timeFilter === 'weekly') passTime = appliedTime >= new Date(today - 7 * 24 * 60 * 60 * 1000).getTime();
          else if (timeFilter === 'monthly') passTime = appliedTime >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
          else if (timeFilter === 'yearly') passTime = appliedTime >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
          else if (timeFilter === 'custom') {
            const start = customStartDate ? new Date(customStartDate).getTime() : 0;
            const end = customEndDate ? new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
            passTime = appliedTime >= start && appliedTime <= end;
          }
        }
      }
      
      // 2. Location Filter
      let passLocation = true;
      if (locationFilter) {
        const match = matchLocation(app.location, `${app.company || ''} ${app.notes || ''}`);
        if (!match || match.country !== locationFilter) {
          passLocation = false;
        }
      }
      
      return passTime && passLocation;
    });
  }, [applications, timeFilter, customStartDate, customEndDate, locationFilter]);

  const WISHLIST_STATUSES: JobStatus[] = ['Wishlist'];
  const ACTIVE_STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer'];
  const INACTIVE_STATUSES: JobStatus[] = ['Rejected', 'Ghosted'];

  const prevLocationFilter = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (locationFilter && locationFilter !== prevLocationFilter.current) {
      setLayoutMode('list');
      
      const activeCount = filteredApplications.filter(app => ACTIVE_STATUSES.includes(app.status)).length;
      const inactiveCount = filteredApplications.filter(app => INACTIVE_STATUSES.includes(app.status)).length;
      const wishlistCount = filteredApplications.filter(app => WISHLIST_STATUSES.includes(app.status)).length;
      
      if (activeCount === 0 && inactiveCount === 0 && wishlistCount > 0) {
        setActiveTab('wishlist');
      } else if (activeCount === 0 && inactiveCount > 0) {
        setActiveTab('inactive');
      } else if (activeCount > 0) {
        setActiveTab('active');
      }
    }
    prevLocationFilter.current = locationFilter;
  }, [locationFilter, filteredApplications]);

  const grouped = filteredApplications.reduce((acc, app) => {
    if (!acc[app.status]) acc[app.status] = [];
    acc[app.status].push(app);
    return acc;
  }, {} as Record<JobStatus, JobApplication[]>);
  
  const displayStatuses = activeTab === 'wishlist' ? WISHLIST_STATUSES : activeTab === 'active' ? ACTIVE_STATUSES : INACTIVE_STATUSES;

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
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer ${activeTab === 'wishlist' ? 'bg-white text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent hover:bg-[#faf9f7]'}`}
          >
            Wishlist
          </button>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {uniqueCountries.length > 0 && (
            <Dropdown
              icon={<MapPin size={14} />}
              value={locationFilter || ''}
              onChange={(val) => onLocationSelect?.(val || null)}
              isActive={!!locationFilter}
              activeClassName="bg-[#e8f1ff] text-[#0068f9] border border-[#0068f9]/30"
              onClear={() => onLocationSelect?.(null)}
              options={[
                { value: '', label: 'All Locations' },
                ...uniqueCountries.map(c => ({ value: c, label: c }))
              ]}
            />
          )}

          <Dropdown
            icon={<Calendar size={14} />}
            labelPrefix="Time:"
            value={timeFilter}
            onChange={(val) => setTimeFilter(val as any)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'today', label: 'Today' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
              { value: 'custom', label: 'Custom' }
            ]}
          />
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-[#efefef] rounded-2xl p-1.5 px-3 shadow-2xs h-[34px]">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs font-medium bg-transparent border-none focus:outline-none text-[#121722]"
              />
              <span className="text-[#777c86] text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs font-medium bg-transparent border-none focus:outline-none text-[#121722]"
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-white border border-[#efefef] rounded-2xl p-1 shadow-2xs h-[34px]">
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`p-1 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center h-full ${layoutMode === 'kanban' ? 'bg-[#faf9f7] text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent'}`}
              title="Kanban View"
            >
              <LayoutDashboard size={14} />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center h-full ${layoutMode === 'list' ? 'bg-[#faf9f7] text-[#121722] shadow-2xs border border-[#efefef]' : 'text-[#777c86] hover:text-[#121722] border border-transparent'}`}
              title="List View"
            >
              <List size={14} />
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
            <h3 className="text-sm font-bold text-[#121722] flex items-center gap-1.5">
              {status}
              {status === 'Ghosted' && (
                <div className="group relative flex items-center">
                  <Info size={14} className="text-[#777c86] cursor-pointer hover:text-[#121722] transition-colors" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-[#121722] text-white text-xs font-medium leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center shadow-xl">
                    Applications without updates for 60 days are automatically marked as Ghosted.
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#121722]"></div>
                  </div>
                </div>
              )}
            </h3>
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
