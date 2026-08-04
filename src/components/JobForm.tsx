import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { Wand2, Loader2, X } from 'lucide-react';
import { createCalendarEvent } from '../lib/calendar';

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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleExtract = async () => {
    if (!pasteText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      const extracted = data.application;
      
      setFormData(prev => ({
        ...prev,
        company: extracted.company || prev.company,
        position: extracted.position || prev.position,
        notes: extracted.notes ? (prev.notes ? prev.notes + '\n\n' + extracted.notes : extracted.notes) : prev.notes
      }));
      
      setPasteText(''); // Clear after success
    } catch (err: any) {
      console.error('Extract error:', err);
      setExtractError(err.message || 'Failed to extract data');
    } finally {
      setIsExtracting(false);
    }
  };

  const [syncCalendar, setSyncCalendar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'resumeUrl' | 'coverLetterUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (syncCalendar && formData.nextInterviewDate) {
        const eventId = await createCalendarEvent(formData as JobApplication);
        if (eventId) {
          formData.calendarEventId = eventId;
        }
      }
      await onSave(formData);
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
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {saveError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{saveError}</div>}
          
          {!initialData && (
          <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-800 mb-2">Smart Paste</label>
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
                className={`self-start flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-sm rounded-lg transition-colors ${(isExtracting || !pasteText.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Company *</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Position *</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</label>
              <select name="status" value={formData.status || 'Applied'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Applied Date</label>
              <input type="date" name="appliedDate" value={formData.appliedDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={syncCalendar} onChange={e => setSyncCalendar(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                Add to Google Calendar
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Contact Name</label>
              <input type="text" name="contactName" value={formData.contactName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Contact Email</label>
              <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Resume</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, 'resumeUrl')} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
              {formData.resumeUrl && <span className="text-xs font-bold text-emerald-600 mt-2 block">✓ Resume attached</span>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Cover Letter</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, 'coverLetterUrl')} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
              {formData.coverLetterUrl && <span className="text-xs font-bold text-emerald-600 mt-2 block">✓ Cover letter attached</span>}
            </div>
          </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
          {initialData && onDelete ? (
            showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-500 uppercase">Are you sure?</span>
                <button type="button" onClick={async () => {
                  try {
                    setSaveError(null);
                    await onDelete(initialData.id);
                  } catch (err: any) {
                    setSaveError(err.message || 'Failed to delete application');
                  }
                }} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold uppercase">Yes</button>
                <button type="button" onClick={() => setShowConfirmDelete(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded text-xs font-bold uppercase">No</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowConfirmDelete(true)} className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider">
                Delete
              </button>
            )
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="px-5 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" form="job-form" disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-colors">
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
