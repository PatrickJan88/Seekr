import React, { useState, useMemo, useRef, useEffect } from 'react';
import { JobApplication, JobStatus, getWorkTypeBadgeStyle, ApplicationLink } from '../types';
import { Calendar, Building, MoreVertical, Eye, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Link2, ExternalLink, Trash2, Edit2 } from 'lucide-react';
import { NoDataState } from './NoDataState';

const STATUSES: JobStatus[] = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface ListViewProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (appId: string, status: JobStatus) => void;
  onDelete: (appId: string) => void;
  trackingSystem?: 'industry' | 'academic';
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
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300" onClick={(e) => { e.stopPropagation(); setShowFull(false); }}>
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


function normalizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ApplicationLinksViewer({ app }: { app: JobApplication }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const links: ApplicationLink[] = useMemo(() => {
    if (app.links && Array.isArray(app.links) && app.links.length > 0) {
      return app.links.filter(l => l && (l.url?.trim() || l.title?.trim()));
    }
    if (app.linkUrl && app.linkUrl.trim()) {
      return [{ title: 'Reference Link', url: app.linkUrl }];
    }
    return [];
  }, [app.links, app.linkUrl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (links.length === 0) return null;

  if (links.length === 1) {
    const link = links[0];
    const url = normalizeUrl(link.url);
    if (!url) return null;

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`${link.title || 'Reference Link'}: ${url}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-[11px] font-medium text-[#0068f9] hover:text-[#024bb1] bg-[#eef5ff] hover:bg-[#dbeafe] border border-[#0068f9]/20 rounded-md transition-colors max-w-full truncate"
      >
        <Link2 size={11} className="shrink-0" />
        <span className="truncate">{link.title || 'Link'}</span>
        <ExternalLink size={10} className="shrink-0 opacity-70" />
      </a>
    );
  }

  return (
    <div className="relative inline-block mt-1" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#0068f9] hover:text-[#024bb1] bg-[#eef5ff] hover:bg-[#dbeafe] border border-[#0068f9]/20 rounded-md transition-colors cursor-pointer"
        title="View all saved links"
      >
        <Link2 size={11} className="shrink-0" />
        <span>{links.length} Links</span>
        <ChevronDown size={10} className="shrink-0 opacity-70" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Saved Hyperlinks
          </div>
          {links.map((link, idx) => {
            const url = normalizeUrl(link.url);
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-[#eef5ff] hover:text-[#0068f9] transition-colors group/item"
              >
                <span className="font-medium truncate pr-2">{link.title || `Link ${idx + 1}`}</span>
                <ExternalLink size={12} className="shrink-0 text-slate-400 group-hover/item:text-[#0068f9]" />
              </a>
            );
          })}
        </div>
      )}
    </div>
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
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={13} className="text-slate-400" />
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} className="text-rose-500" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ListView({ applications, onEdit, onStatusChange, onDelete, trackingSystem = 'industry' }: ListViewProps) {
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
    if (isDraggingRef.current) return;
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

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    position: 250,
    company: 200,
    appliedDate: 120,
    nextInterview: 140,
    notes: 250,
    status: 150,
    actions: 80
  });

  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    startXRef.current = e.pageX;
    startWidthRef.current = colWidths[col] || 150;
  };

  useEffect(() => {
    if (!resizingCol) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      isDraggingRef.current = true;
      const delta = e.pageX - startXRef.current;
      setColWidths(prev => ({
        ...prev,
        [resizingCol]: Math.max(50, startWidthRef.current + delta)
      }));
    };
    
    const handleMouseUp = () => {
      setResizingCol(null);
      // use a short timeout to prevent click event triggering requestSort
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  return (
    <div className={`w-full bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden flex-grow flex flex-col h-[calc(100vh-270px)] ${resizingCol ? 'select-none' : ''}`}>
      <div className="overflow-auto flex-grow scrollbar-thin outline-none focus:outline-none">
        <table className="w-full text-left border-separate border-spacing-0 outline-none focus:outline-none table-fixed" style={{ minWidth: Object.values(colWidths).reduce((a: number, b: number) => a + b, 0) }}>
          <thead className="bg-[#faf9f7] sticky top-0 z-10">
            <tr className="outline-none focus:outline-none border-0">
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                style={{ width: colWidths.position }} onClick={() => requestSort('position')} onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'DIV' || !(e.target as HTMLElement).className.includes('cursor-col-resize')) e.preventDefault(); }}
              >
                <div className="flex items-center">Position {getSortIcon('position')}</div>
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 group-hover:bg-[#efefef]" onMouseDown={(e) => handleMouseDown(e, 'position')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                style={{ width: colWidths.company }} onClick={() => requestSort('company')} onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'DIV' || !(e.target as HTMLElement).className.includes('cursor-col-resize')) e.preventDefault(); }}
              >
                <div className="flex items-center">{trackingSystem === 'academic' ? 'Institution' : 'Company'} {getSortIcon('company')}</div>
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 group-hover:bg-[#efefef]" onMouseDown={(e) => handleMouseDown(e, 'company')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                style={{ width: colWidths.appliedDate }} onClick={() => requestSort('appliedDate')} onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'DIV' || !(e.target as HTMLElement).className.includes('cursor-col-resize')) e.preventDefault(); }}
              >
                <div className="flex items-center">Applied Date {getSortIcon('appliedDate')}</div>
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 group-hover:bg-[#efefef]" onMouseDown={(e) => handleMouseDown(e, 'appliedDate')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap" style={{ width: colWidths.nextInterview }}>
                Next Interview
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 hover:bg-opacity-50" onMouseDown={(e) => handleMouseDown(e, 'nextInterview')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86]" style={{ width: colWidths.notes }}>
                Notes
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 hover:bg-opacity-50" onMouseDown={(e) => handleMouseDown(e, 'notes')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap cursor-pointer group hover:bg-[#efefef]/50 transition-colors select-none outline-none focus:outline-none ring-0 focus:ring-0"
                style={{ width: colWidths.status }} onClick={() => requestSort('status')} onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'DIV' || !(e.target as HTMLElement).className.includes('cursor-col-resize')) e.preventDefault(); }}
              >
                <div className="flex items-center">Status {getSortIcon('status')}</div>
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 group-hover:bg-[#efefef]" onMouseDown={(e) => handleMouseDown(e, 'status')} />
              </th>
              <th className="relative border-b border-[#efefef] px-6 py-3.5 text-xs font-semibold text-[#777c86] whitespace-nowrap text-right" style={{ width: colWidths.actions }}>
                Actions
                <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[#0068f9] transition-colors z-20 hover:bg-opacity-50" onMouseDown={(e) => handleMouseDown(e, 'actions')} />
              </th>
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
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.position }}>
                    <div className="font-bold text-sm text-[#121722] truncate block" title={app.position}>{app.position}</div>
                    {(app.location || app.workType) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#777c86] mt-0.5 max-w-full">
                        {app.location && <span className="truncate">{app.location}</span>}
                        {app.workType && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${getWorkTypeBadgeStyle(app.workType)}`}>
                            {app.workType}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.company }}>
                    <div className="text-sm text-[#777c86] truncate block" title={app.company}>{app.company}</div>
                    <ApplicationLinksViewer app={app} />
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.appliedDate }}>
                    <span className="text-sm text-[#777c86] truncate block">
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.nextInterview }}>
                    {app.nextInterviewDate ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0068f9] bg-[#faf9f7] border border-[#efefef] px-2.5 py-1 rounded-full whitespace-nowrap truncate max-w-full">
                        <Calendar size={12} className="flex-shrink-0" />
                        <span className="truncate">{new Date(app.nextInterviewDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-[#777c86]">-</span>
                    )}
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.notes }}>
                    <TruncatedNotes text={app.notes || ''} />
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0" style={{ width: colWidths.status }}>
                    <StatusDropdown 
                      status={app.status} 
                      onChange={(newStatus) => onStatusChange(app.id, newStatus)} 
                    />
                  </td>
                  <td className="border-b border-[#efefef] px-6 py-4 max-w-0 text-right" style={{ width: colWidths.actions }}>
                    <ActionDropdown onEdit={() => onEdit(app)} onDelete={() => onDelete(app.id)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <NoDataState 
                    icon="/icons/person-building-pipeline.svg" 
                    title="No applications yet" 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
