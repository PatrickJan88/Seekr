import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { Wand2, Loader2, X, ChevronDown } from 'lucide-react';
import { FileUpload, UploadedFile } from './FileUpload';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

const STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface JobFormProps {
  initialData?: JobApplication;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export function JobForm({ initialData, onSave, onCancel, onDelete }: JobFormProps) {
  const [formData, setFormData] = useState<Partial<JobApplication>>(
    initialData || { status: 'Applied', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const parseJobDescriptionFallback = (text: string) => {
    let company = '';
    let position = '';
    let location = '';
    let workType: 'On-site' | 'Hybrid' | 'Remote' | undefined;
    let extraNotes: string[] = [];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Detect workType from text
    if (/\b(?:On-site|Onsite)\b/i.test(text)) {
      workType = 'On-site';
    } else if (/\bHybrid\b/i.test(text)) {
      workType = 'Hybrid';
    } else if (/\bRemote\b/i.test(text)) {
      workType = 'Remote';
    }

    // Helper to clean gender/diversity markers from job titles e.g. (m/w/d), (f/m/d), (m/f/x)
    const cleanPositionStr = (str?: string) => {
      if (!str) return '';
      return str
        .replace(/[\(\[\{]\s*(?:m\/w\/d|f\/m\/d|m\/f\/x|m\/w\/x|d\/f\/m|w\/m\/d|f\/m\/x|all genders|f\/m\/other|m\/f\/d)\s*[\)\]\}]/gi, '')
        .trim();
    };

    // Helper to clean work method policy tags from location strings e.g. "Berlin, Germany (On-site)" -> "Berlin, Germany"
    const cleanLocationStr = (str?: string) => {
      if (!str) return '';
      let loc = str;
      // Strip parenthesized or bracketed work modes
      loc = loc.replace(/[\(\[\{]\s*(?:On-site|Onsite|Hybrid|Remote|Full-time|Part-time)\s*[\)\]\}]/gi, '');
      // Strip standalone work mode words
      loc = loc.replace(/\b(?:On-site|Onsite|Hybrid|Remote)\b/gi, '');
      // Clean duplicate whitespace and leading/trailing separators
      return loc.replace(/\s+/g, ' ').replace(/^[\s,·•|-]+|[\s,·•|-]+$/g, '').trim();
    };

    // Helper to extract clean company from line with separators like '·', '|', '•', ','
    const cleanCompanyStr = (str?: string) => {
      if (!str) return '';
      const parts = str.split(/[\·\•\|]/).map(p => p.trim()).filter(Boolean);
      let comp = parts[0] || str;
      // Remove work modes / location trailing tags if present in the first part
      comp = comp.replace(/\s*[\(\[\{](?:On-site|Onsite|Hybrid|Remote|Full-time|Part-time)[\)\]\}]/gi, '').trim();
      return comp;
    };

    // 1. Explicit Labels
    const compMatch = text.match(/(?:Company|Employer|Organization|Client):\s*([^\n]+)/i);
    if (compMatch) company = cleanCompanyStr(compMatch[1]);

    const posMatch = text.match(/(?:Position|Role|Job Title|Title|Job):\s*([^\n]+)/i);
    if (posMatch) position = cleanPositionStr(posMatch[1]);

    const locMatch = text.match(/(?:Location|Site|Office|City):\s*([^\n]+)/i);
    if (locMatch) location = cleanLocationStr(locMatch[1]);

    // 2. Pattern: "Position at Company" or "Position @ Company"
    if (!position || !company) {
      const atMatch = text.match(/([A-Z][A-Za-z0-9\s\-\.\/]{1,50})\s+(?:at|@)\s+([A-Z][A-Za-z0-9\s&\-\.]{1,50})/i);
      if (atMatch) {
        if (!position) position = cleanPositionStr(atMatch[1]);
        if (!company) company = cleanCompanyStr(atMatch[2]);
      }
    }

    // 3. Multi-line pattern check (e.g. Line 1: "UX/UI Designer (m/w/d)", Line 2: "Technology & Strategy · Berlin, Germany (On-site)")
    if ((!position || !company) && lines.length >= 1) {
      const roleRegex = /(?:Senior|Junior|Staff|Lead|Principal|Head of|VP of|UX\/UI|UI\/UX)?\s*([A-Za-z0-9\s\/&]+(?:Engineer|Developer|Manager|Designer|Analyst|Architect|Specialist|Director|Consultant|Coordinator|Intern|Associate|Officer|Executive|Scientist|Administrator|Representative))/i;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if line looks like a job title
        if (!position && roleRegex.test(line)) {
          position = cleanPositionStr(line);
          
          // Check if next line contains company or company · location
          if (!company && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            company = cleanCompanyStr(nextLine);

            // Collect location or remaining info from nextLine
            if (nextLine.includes('·') || nextLine.includes('•') || nextLine.includes('|')) {
              const parts = nextLine.split(/[\·\•\|]/).map(p => p.trim()).filter(Boolean);
              if (parts.length > 1) {
                const locPart = parts.slice(1).join(' · ');
                const cleanLoc = cleanLocationStr(locPart);
                if (!location && cleanLoc) location = cleanLoc;

                const policyMatch = locPart.match(/[\(\[\{]?\b(On-site|Onsite|Hybrid|Remote)\b[\)\]\}]?/i);
                if (policyMatch) {
                  extraNotes.push(`Workplace Policy: ${policyMatch[1]}`);
                }
              }
            }
          }
          break;
        }
      }
    }

    // 4. Delimited first line fallback: "Position - Company" or "Company | Position"
    if ((!position || !company) && lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.includes('-') || firstLine.includes('|') || firstLine.includes(':')) {
        const parts = firstLine.split(/[\-\|:]/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const roleRegex = /(Engineer|Developer|Manager|Designer|Analyst|Lead|Architect|Specialist|Director|Consultant|Coordinator|Intern|Associate|Officer|Executive|Scientist|Administrator|Representative)/i;
          if (roleRegex.test(parts[0])) {
            if (!position) position = cleanPositionStr(parts[0]);
            if (!company) company = cleanCompanyStr(parts[1]);
          } else if (roleRegex.test(parts[1])) {
            if (!position) position = cleanPositionStr(parts[1]);
            if (!company) company = cleanCompanyStr(parts[0]);
          } else {
            if (!position) position = cleanPositionStr(parts[0]);
            if (!company) company = cleanCompanyStr(parts[1]);
          }
        }
      }
    }

    // Clean up if position & company ended up identical
    if (position && company && position.toLowerCase() === company.toLowerCase()) {
      company = '';
    }

    // Build notes: combine location details and rest of text
    const fullTextNotes = text.slice(0, 1500).trim();
    const notes = extraNotes.length > 0 
      ? extraNotes.join('\n') + '\n\n' + fullTextNotes 
      : fullTextNotes;

    return { company, position, location, workType, notes };
  };

  const handleExtract = async () => {
    if (!pasteText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      let extracted: { company?: string; position?: string; location?: string; workType?: string; notes?: string } = {};

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      }).catch(() => null);

      if (res && res.ok) {
        const responseText = await res.text();
        try {
          const data = JSON.parse(responseText);
          if (data?.application) {
            extracted = data.application;
          }
        } catch {
          // Response was non-JSON (e.g. static hosting rewrite)
          extracted = parseJobDescriptionFallback(pasteText);
        }
      } else {
        // Fetch failed or non-200 (e.g. static host endpoint)
        extracted = parseJobDescriptionFallback(pasteText);
      }

      // If backend gave empty or missing fields, complement with fallback
      if (!extracted.company && !extracted.position) {
        const fallback = parseJobDescriptionFallback(pasteText);
        extracted.company = extracted.company || fallback.company;
        extracted.position = extracted.position || fallback.position;
        extracted.location = extracted.location || fallback.location;
        extracted.workType = extracted.workType || fallback.workType;
        extracted.notes = extracted.notes || fallback.notes;
      }

      const cleanLocationStr = (str?: string) => {
        if (!str) return '';
        let loc = str;
        loc = loc.replace(/[\(\[\{]\s*(?:On-site|Onsite|Hybrid|Remote|Full-time|Part-time)\s*[\)\]\}]/gi, '');
        loc = loc.replace(/\b(?:On-site|Onsite|Hybrid|Remote)\b/gi, '');
        return loc.replace(/\s+/g, ' ').replace(/^[\s,·•|-]+|[\s,·•|-]+$/g, '').trim();
      };

      if (extracted.location) {
        extracted.location = cleanLocationStr(extracted.location);
      }

      const normalizeWorkType = (val?: string): 'On-site' | 'Hybrid' | 'Remote' | undefined => {
        if (!val) return undefined;
        if (/^\s*(?:On-site|Onsite)\s*$/i.test(val)) return 'On-site';
        if (/^\s*Hybrid\s*$/i.test(val)) return 'Hybrid';
        if (/^\s*Remote\s*$/i.test(val)) return 'Remote';
        return undefined;
      };

      let extractedWorkType = normalizeWorkType(extracted.workType);
      if (!extractedWorkType) {
        const fallback = parseJobDescriptionFallback(pasteText);
        extractedWorkType = fallback.workType;
      }

      if (extracted.company || extracted.position || extracted.location || extractedWorkType || extracted.notes) {
        setFormData(prev => ({
          ...prev,
          company: extracted.company || prev.company,
          position: extracted.position || prev.position,
          location: extracted.location || prev.location,
          workType: extractedWorkType || prev.workType,
          notes: extracted.notes ? (prev.notes ? prev.notes + '\n\n' + extracted.notes : extracted.notes) : prev.notes
        }));
        toast.success('Fields auto-filled successfully!');
        setPasteText('');
      } else {
        toast.info('Pasted text added to notes.');
        setFormData(prev => ({
          ...prev,
          notes: prev.notes ? prev.notes + '\n\n' + pasteText : pasteText
        }));
        setPasteText('');
      }
    } catch (err: any) {
      console.error('Extract error:', err);
      // Even on error, perform fallback fill
      const fallback = parseJobDescriptionFallback(pasteText);
      setFormData(prev => ({
        ...prev,
        company: fallback.company || prev.company,
        position: fallback.position || prev.position,
        location: fallback.location || prev.location,
        workType: fallback.workType || prev.workType,
        notes: fallback.notes ? (prev.notes ? prev.notes + '\n\n' + fallback.notes : fallback.notes) : prev.notes
      }));
      toast.success('Fields auto-filled from job description!');
      setPasteText('');
    } finally {
      setIsExtracting(false);
    }
  };

  // syncCalendar removed

  const isPastInterview = React.useMemo(() => {
    if (!formData.nextInterviewDate) return false;
    return new Date(formData.nextInterviewDate).getTime() < Date.now();
  }, [formData.nextInterviewDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentsChange = (files: UploadedFile[]) => {
    const attachments = files.map(f => ({
      name: f.fileName,
      url: f.base64 || f.url || ''
    })).filter(f => f.url !== '');

    setFormData(prev => ({ ...prev, attachments }));
  };

  const initialFiles = React.useMemo(() => {
    const files: UploadedFile[] = [];
    if (initialData?.attachments && initialData.attachments.length > 0) {
      initialData.attachments.forEach((att, idx) => {
        files.push({
          id: `att-${idx}`,
          fileName: att.name,
          url: att.url,
          progress: 100,
          uploading: false,
        });
      });
    } else {
      if (initialData?.resumeUrl) {
        files.push({
          id: 'old-resume',
          fileName: 'Attached_Resume',
          url: initialData.resumeUrl,
          progress: 100,
          uploading: false,
        });
      }
      if (initialData?.coverLetterUrl) {
        files.push({
          id: 'old-cover',
          fileName: 'Attached_CoverLetter',
          url: initialData.coverLetterUrl,
          progress: 100,
          uploading: false,
        });
      }
    }
    return files;
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data", formData);
    
    if (!formData.company?.trim()) {
      setSaveError("Company is required.");
      return;
    }
    if (!formData.position?.trim()) {
      setSaveError("Position is required.");
      return;
    }
    if (formData.reminder && formData.reminder !== 'none' && isPastInterview) {
      setSaveError("Cannot set a reminder for an interview time that has already passed.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (formData.reminder && formData.reminder !== 'none' && formData.nextInterviewDate) {
        if (auth.currentUser) {
          const isCustom = formData.reminder === 'custom';
          let reminderMsg = `Reminder set for ${formData.company} interview ${formData.reminder} before.`;
          if (isCustom && formData.customReminderDate && formData.customReminderEndDate) {
            reminderMsg = `Reminder set for ${formData.company} interview from ${formData.customReminderDate} to ${formData.customReminderEndDate}.`;
          } else if (isCustom && formData.customReminderDate) {
            reminderMsg = `Reminder set for ${formData.company} interview on ${formData.customReminderDate}.`;
          } else if (isCustom) {
            reminderMsg = `Reminder set for ${formData.company} interview.`;
          }
          toast.success(reminderMsg);
        }
      }
      await onSave({ ...formData, reminderSent: false });
    } catch (err: any) {
      console.error("Save Error Caught:", err);
      setSaveError(err.message || 'Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 m-0">
            {initialData ? 'Edit Application' : 'New Application'}
          </h2>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {saveError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{saveError}</div>}
          
          {!initialData && (
          <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 mb-2">Smart Paste</label>
            <p className="text-xs text-blue-600 mb-3">Paste a job description here to automatically fill out the company, position, and notes.</p>
            <div className="flex flex-col gap-2">
              <textarea 
                value={pasteText} 
                onChange={e => setPasteText(e.target.value)} 
                rows={3} 
                placeholder="Paste job description..."
                className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm resize-y"
              />
              {extractError && <div className="text-red-500 text-xs font-medium">{extractError}</div>}
              <button 
                type="button" 
                onClick={handleExtract}
                disabled={isExtracting || !pasteText.trim()}
                className={`self-start gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2 ${(isExtracting || !pasteText.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isExtracting ? 'Extracting...' : 'Auto-fill fields'}
              </button>
            </div>
          </div>
        )}
        <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Company *</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Position *</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Location</label>
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g. Stockholm, Sweden" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Work type</label>
              <div className="relative">
                <select name="workType" value={formData.workType || ''} onChange={handleChange} className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm appearance-none cursor-pointer">
                  <option value="">Select work type...</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
              <div className="relative">
                <select name="status" value={formData.status || 'Applied'} onChange={handleChange} className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm appearance-none cursor-pointer">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Applied Date</label>
              <input type="date" name="appliedDate" value={formData.appliedDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className={`w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 outline-none transition-all text-sm ${isPastInterview ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'}`} />
              {isPastInterview && <p className="text-[10px] text-amber-600 mt-1">This time is in the past. Reminders cannot be set.</p>}
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-400 mb-1">Reminder</label>
              <div className="relative">
                <select name="reminder" value={(formData.nextInterviewDate && !isPastInterview) ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate || isPastInterview} className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer">
                  <option value="none">None</option>
                  <option value="15 mins">15 mins before</option>
                  <option value="1 hour">1 hour before</option>
                  <option value="2 hours">2 hours before</option>
                  <option value="1 day">1 day before</option>
                  <option value="2 days">2 days before</option>
                  <option value="custom">Custom</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {formData.reminder === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="date" name="customReminderDate" value={formData.customReminderDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="Start Date" />
                  <span className="text-slate-400 text-sm">to</span>
                  <input type="date" name="customReminderEndDate" value={formData.customReminderEndDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="End Date" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Contact Name</label>
              <input type="text" name="contactName" value={formData.contactName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Contact Email</label>
              <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"></textarea>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <FileUpload 
              label="Attachments" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.csv"
              description="Accepted: .pdf,.doc,.docx,excel,image,CSV. Max: 5MB." 
              maxSizeMB={5}
              maxFiles={5}
              initialFiles={initialFiles}
              onFilesChange={handleAttachmentsChange} 
            />
          </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
          {initialData && onDelete ? (
              <button type="button" onClick={(e) => { e.preventDefault(); onDelete(initialData.id); }} className="text-red-500 hover:text-red-600 font-bold text-xs">
                Delete
              </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2">
              Cancel
            </button>
            <button type="submit" form="job-form" disabled={isSaving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2">
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
