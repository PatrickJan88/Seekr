import React, { useState, useMemo, useRef, useEffect } from 'react';
import { JobApplication, JobStatus, getWorkTypeBadgeStyle } from '../types';
import { Calendar, Building, MoreVertical, Eye, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const STATUSES: JobStatus[] = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface ListViewProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (appId: string, status: JobStatus) => void;
  onDelete: (appId: string) => void;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  Wishlist: 'bg-indigo-100 text-indigo-700',
  Applied: 'bg-slate-100 text-slate-700',
  Screening: 'bg-blue-100 text-blue-700',
  Technical: 'bg-purple-100 text-purple-700',
  Final: 'bg-orange-100 text-orange-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Ghosted: 'bg-gray-100 text-gray-700',
};

function StatusDropdown({ status, onChange }: { status: JobStatus; onChange: (s: JobStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border border-transparent hover:border-slate-300 ${STATUS_COLORS[status]}`}
      >
        {status}
        <ChevronDown size={12} className="ml-1 opacity-70" />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 flex items-center justify-between ${s === status ? 'font-bold' : ''}`}
            >
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[s]}`}>
                {s}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TruncatedNotes({ text }: { text: string }) {
  const [showFull, setShowFull] = useState(false);
  
  if (!text) return <span className="text-slate-400 italic">-</span>;

  return (
    <>
      <div 
        className="text-slate-600 cursor-pointer hover:text-slate-900 group relative inline-flex items-center w-full"
        onClick={(e) => { e.stopPropagation(); setShowFull(true); }}
      >
        <span className="truncate text-sm pr-6 block w-full">{text}</span>
        <span className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 bg-white shadow-sm px-1.5 py-1 rounded-md text-xs flex items-center border border-slate-200">
          <Eye size={14} />
        </span>
      </div>

      {showFull && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setShowFull(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg">Application Notes</h3>
              <button onClick={() => setShowFull(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500">✕</button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
              {text}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function ActionDropdown({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ListView({ applications, onEdit, onStatusChange, onDelete }: ListViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedApplications = useMemo(() => {
    let sortableItems = [...applications];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'status') {
           const statusOrder = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];
           aValue = statusOrder.indexOf(a.status);
           bValue = statusOrder.indexOf(b.status);
        } else if (sortConfig.key === 'position' || sortConfig.key === 'company') {
           aValue = (aValue || '').toString().toLowerCase();
           bValue = (bValue || '').toString().toLowerCase();
        } else if (sortConfig.key === 'appliedDate') {
           aValue = aValue ? new Date(aValue).getTime() : 0;
           bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [applications, sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <ArrowUpDown size={12} className="ml-1 inline-block opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={12} className="ml-1 inline-block text-[#0068f9]" /> : 
      <ArrowDown size={12} className="ml-1 inline-block text-[#0068f9]" />;
  };

  return (
    <div className="w-full bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden flex-grow flex flex-col h-[calc(100vh-270px)]">
      <div className="overflow-auto flex-grow scrollbar-thin outline-none focus:outline-none">
        <table className="w-full text-left border-separate border-spacing-0 outline-none focus:outline-none">
          <thead className="bg-[#faf9f7] sticky top-0 z-10">
            <tr className="outline-none focus:outline-none border-0">
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                onClick={() => requestSort('position')} onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center">Position {getSortIcon('position')}</div>
              </th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                onClick={() => requestSort('company')} onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center">Company {getSortIcon('company')}</div>
              </th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                onClick={() => requestSort('appliedDate')} onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center">Applied Date {getSortIcon('appliedDate')}</div>
              </th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap">Next Interview</th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86]">Notes</th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                onClick={() => requestSort('status')} onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center">Status {getSortIcon('status')}</div>
              </th>
              <th className="border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              sortedApplications.map((app) => (
                <tr 
                  key={app.id} 
                  onClick={() => onEdit(app)}
                  className="hover:bg-[#faf9f7] transition-colors cursor-pointer group"
                >
                  <td className="border-b border-[#efefef] px-6 py-4">
                    <div className="font-bold text-sm text-[#121722] max-w-[180px] truncate" title={app.position}>{app.position}</div>
                    {(app.location || app.workType) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#777c86] mt-0.5">
                        {app.location && <span className="truncate max-w-[120px]">{app.location}</span>}
                        {app.workType && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${getWorkTypeBadgeStyle(app.workType)}`}>
                            {app.workType}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4">
                    <div className="text-sm text-[#777c86] max-w-[150px] truncate" title={app.company}>{app.company}</div>
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4">
                    <span className="text-sm text-[#777c86]">
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4">
                    {app.nextInterviewDate ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0068f9] bg-[#faf9f7] border border-[#efefef] px-2.5 py-1 rounded-full whitespace-nowrap">
                        <Calendar size={12} />
                        {new Date(app.nextInterviewDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-[#777c86]">-</span>
                    )}
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 w-full max-w-0 min-w-[200px]">
                    <TruncatedNotes text={app.notes || ''} />
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4">
                    <StatusDropdown 
                      status={app.status} 
                      onChange={(newStatus) => onStatusChange(app.id, newStatus)} 
                    />
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 text-right">
                    <ActionDropdown onEdit={() => onEdit(app)} onDelete={() => onDelete(app.id)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#777c86] text-sm">
                  No applications found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
