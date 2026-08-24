import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { Wand2, Loader2, X, ChevronDown, MapPin, Globe } from 'lucide-react';
import { FileUpload, UploadedFile } from './FileUpload';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { LOCATION_DATA, parseLocationToGroup } from '../data/locationData';

const STATUSES: JobStatus[] = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface JobFormProps {
  trackingSystem?: 'industry' | 'academic';
  initialData?: JobApplication;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
  isDemo?: boolean;
}

export function JobForm({ initialData, onSave, onCancel, onDelete, isDemo = false, trackingSystem = 'industry' }: JobFormProps) {
  const [formData, setFormData] = useState<Partial<JobApplication>>(
    initialData || { status: 'Applied', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0], trackingSystem }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Two-Level Location Selection State
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [customCityText, setCustomCityText] = useState<string>('');

  const syncLocationState = (locString?: string) => {
    if (!locString) {
      setSelectedCountry('');
      setSelectedCity('');
      setCustomCityText('');
      return;
    }
    const parsed = parseLocationToGroup(locString);
    setSelectedCountry(parsed.country);
    setSelectedCity(parsed.cityValue);
    setCustomCityText(parsed.customText || '');
  };

  useEffect(() => {
    if (initialData?.location) {
      syncLocationState(initialData.location);
    }
  }, [initialData?.id, initialData?.location]);

  const currentCountryGroup = React.useMemo(() => {
    return LOCATION_DATA.find(g => g.country === selectedCountry);
  }, [selectedCountry]);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    const group = LOCATION_DATA.find(g => g.country === countryName);
    if (group && group.cities.length > 0) {
      const firstCity = group.cities[0].value;
      setSelectedCity(firstCity);
      if (firstCity.startsWith('custom_') || countryName === 'Other Country') {
        const formatted = customCityText 
          ? (countryName !== 'Other Country' ? `${customCityText}, ${countryName}` : customCityText)
          : (countryName !== 'Other Country' ? countryName : '');
        setFormData(prev => ({ ...prev, location: formatted }));
      } else {
        setFormData(prev => ({ ...prev, location: firstCity }));
      }
    } else {
      setSelectedCity('');
      setFormData(prev => ({ ...prev, location: countryName }));
    }
  };

  const handleCitySelect = (cityVal: string) => {
    setSelectedCity(cityVal);
    if (cityVal.startsWith('custom_') || selectedCountry === 'Other Country') {
      const formatted = customCityText 
        ? (selectedCountry && selectedCountry !== 'Other Country' ? `${customCityText}, ${selectedCountry}` : customCityText)
        : (selectedCountry !== 'Other Country' ? selectedCountry : '');
      setFormData(prev => ({ ...prev, location: formatted }));
    } else {
      setFormData(prev => ({ ...prev, location: cityVal }));
    }
  };

  const handleCustomCityChange = (text: string) => {
    setCustomCityText(text);
    const formatted = text 
      ? (selectedCountry && selectedCountry !== 'Other Country' ? `${text}, ${selectedCountry}` : text)
      : (selectedCountry !== 'Other Country' ? selectedCountry : '');
    setFormData(prev => ({ ...prev, location: formatted }));
  };

  // Helper to check if a text fragment is post metadata rather than a physical location
  const isMetadataSegment = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const timePattern = /\b(?:\d+\+?\s*(?:s|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|mth|mths|month|months|y|yr|yrs|year|years)\s*ago)\b/i;
    const postedPattern = /\b(?:posted|reposted|just posted|posted today|posted yesterday|today|yesterday)\b/i;
    const shortTimePattern = /^\d+[dhwm]$/i;
    const applicantPattern = /\b(?:over|under|about|more than|less than|around)?\s*\d+\+?\s*applicants?\b/i;
    const firstApplicantPattern = /\b(?:be among the first|first)\s+\d+\s+applicants?\b/i;
    const statusPattern = /\b(?:easy apply|promoted|actively hiring|actively recruiting|urgent|full-time|part-time)\b/i;

    return timePattern.test(trimmed) || 
           postedPattern.test(trimmed) || 
           shortTimePattern.test(trimmed) || 
           applicantPattern.test(trimmed) || 
           firstApplicantPattern.test(trimmed) || 
           statusPattern.test(trimmed);
  };

  // Helper to sanitize location string and extract metadata (posting date, applicant count) for notes
  const sanitizeLocationAndExtractMeta = (rawLoc?: string): { location: string; metadata: string[] } => {
    if (!rawLoc) return { location: '', metadata: [] };

    const metadata: string[] = [];
    const parts = rawLoc.split(/[\·\•\|]/).map(p => p.trim()).filter(Boolean);
    const locationParts: string[] = [];

    for (const part of parts) {
      if (isMetadataSegment(part)) {
        metadata.push(part);
      } else {
        let candidate = part;

        // Extract inline relative time pattern (e.g. "2 days ago") if mixed with location
        const timeMatch = candidate.match(/\b(?:\d+\+?\s*(?:d|day|days|w|week|weeks|m|month|months)\s*ago)\b/i);
        if (timeMatch) {
          metadata.push(timeMatch[0]);
          candidate = candidate.replace(timeMatch[0], '');
        }

        // Extract inline applicant counts (e.g. "Over 100 applicants") if mixed
        const appMatch = candidate.match(/\b(?:over|under|about|more than|less than|around)?\s*\d+\+?\s*applicants?\b/i);
        if (appMatch) {
          metadata.push(appMatch[0]);
          candidate = candidate.replace(appMatch[0], '');
        }

        // Strip work mode policies
        candidate = candidate.replace(/[\(\[\{]\s*(?:On-site|Onsite|Hybrid|Remote|Full-time|Part-time)\s*[\)\]\}]/gi, '');
        candidate = candidate.replace(/\b(?:On-site|Onsite|Hybrid|Remote)\b/gi, '');

        // Clean duplicate whitespace and leading/trailing punctuation
        candidate = candidate.replace(/\s+/g, ' ').replace(/^[\s,·•|-]+|[\s,·•|-]+$/g, '').trim();

        if (candidate && !isMetadataSegment(candidate)) {
          locationParts.push(candidate);
        }
      }
    }

    const finalLoc = locationParts.join(', ').replace(/\s+/g, ' ').replace(/^[\s,·•|-]+|[\s,·•|-]+$/g, '').trim();

    // If finalLoc is purely numeric or matches metadata, discard as location
    if (/^\d+$/.test(finalLoc) || isMetadataSegment(finalLoc)) {
      return { location: '', metadata };
    }

    return { location: finalLoc, metadata };
  };

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

    // Helper to extract clean company from line with separators like '·', '|', '•', ','
    const cleanCompanyStr = (str?: string) => {
      if (!str) return '';
      const parts = str.split(/[\·\•\|]/).map(p => p.trim()).filter(Boolean);
      let comp = parts[0] || str;
      comp = comp.replace(/\s*[\(\[\{](?:On-site|Onsite|Hybrid|Remote|Full-time|Part-time)[\)\]\}]/gi, '').trim();
      return comp;
    };

    // 1. Explicit Labels
    const compMatch = text.match(/(?:Company|Employer|Organization|Client):\s*([^\n]+)/i);
    if (compMatch) company = cleanCompanyStr(compMatch[1]);

    const posMatch = text.match(/(?:Position|Role|Job Title|Title|Job):\s*([^\n]+)/i);
    if (posMatch) position = cleanPositionStr(posMatch[1]);

    const locMatch = text.match(/(?:Location|Site|Office|City):\s*([^\n]+)/i);
    if (locMatch) {
      const { location: cleanLoc, metadata: meta } = sanitizeLocationAndExtractMeta(locMatch[1]);
      if (cleanLoc) location = cleanLoc;
      if (meta.length > 0) extraNotes.push(`Posting Info: ${meta.join(' · ')}`);
    }

    // 2. Pattern: "Position at Company" or "Position @ Company"
    if (!position || !company) {
      const atMatch = text.match(/([A-Z][A-Za-z0-9\s\-\.\/]{1,50})\s+(?:at|@)\s+([A-Z][A-Za-z0-9\s&\-\.]{1,50})/i);
      if (atMatch) {
        if (!position) position = cleanPositionStr(atMatch[1]);
        if (!company) company = cleanCompanyStr(atMatch[2]);
      }
    }

    // 3. Multi-line pattern check (e.g. Line 1: "Spiele-Palast GmbH", Line 2: "UI/UX Designer Games (m/f/d)", Line 3: "Berlin, Germany · 2 days ago · Over 100 applicants")
    if ((!position || !company) && lines.length >= 1) {
      const roleRegex = /(?:Senior|Junior|Staff|Lead|Principal|Head of|VP of|UX\/UI|UI\/UX)?\s*([A-Za-z0-9\s\/&]+(?:Engineer|Developer|Manager|Designer|Analyst|Architect|Specialist|Director|Consultant|Coordinator|Intern|Associate|Officer|Executive|Scientist|Administrator|Representative|Worker|Student|Assistant|Clerk|Trainee|Technician))/i;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!position && roleRegex.test(line)) {
          position = cleanPositionStr(line);
          
          // Check if previous line exists and looks like company name
          if (!company && i > 0) {
            const prevLine = lines[i - 1];
            if (!roleRegex.test(prevLine) && !isMetadataSegment(prevLine)) {
              company = cleanCompanyStr(prevLine);
            }
          }

          // Check next lines for company or location
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (!company) {
              company = cleanCompanyStr(nextLine);
            }

            if (nextLine.includes('·') || nextLine.includes('•') || nextLine.includes('|')) {
              const parts = nextLine.split(/[\·\•\|]/).map(p => p.trim()).filter(Boolean);
              for (const part of parts) {
                const { location: cleanLoc, metadata: meta } = sanitizeLocationAndExtractMeta(part);
                if (cleanLoc && !location) {
                  location = cleanLoc;
                }
                if (meta.length > 0) {
                  extraNotes.push(`Posting Info: ${meta.join(' · ')}`);
                }
              }
            } else {
              const { location: cleanLoc, metadata: meta } = sanitizeLocationAndExtractMeta(nextLine);
              if (cleanLoc && !location) {
                location = cleanLoc;
              }
              if (meta.length > 0) {
                extraNotes.push(`Posting Info: ${meta.join(' · ')}`);
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
          const roleRegex = /(Engineer|Developer|Manager|Designer|Analyst|Lead|Architect|Specialist|Director|Consultant|Coordinator|Intern|Associate|Officer|Executive|Scientist|Administrator|Representative|Worker|Student|Assistant|Clerk|Trainee|Technician)/i;
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

      if (isDemo) {
        extracted = parseJobDescriptionFallback(pasteText);
      } else {
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

      if (extracted.location) {
        const { location: cleanLoc, metadata: locMeta } = sanitizeLocationAndExtractMeta(extracted.location);
        extracted.location = cleanLoc;
        if (locMeta.length > 0) {
          const metaText = `Posting Info: ${locMeta.join(' · ')}`;
          extracted.notes = extracted.notes ? `${extracted.notes}\n\n${metaText}` : metaText;
        }
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
        if (extracted.location) {
          syncLocationState(extracted.location);
        }
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
    if (isDemo) {
      toast.info('Demo Mode: Saving application modifications is restricted in this portfolio preview.');
      onCancel();
      return;
    }
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
    <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-[#121722]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#efefef]">
        <div className="flex items-center justify-between p-6 border-b border-[#efefef] shrink-0">
          <h2 className="text-xl font-extrabold text-[#121722] m-0">
            {initialData ? 'Edit Application' : 'New Application'}
          </h2>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all hover:bg-[#faf9f7] h-9 w-9 p-0 text-[#777c86] hover:text-[#121722] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isDemo && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px]">read-only</span>
              Portfolio Demo Mode — Application details are in read-only preview
            </span>
          </div>
        )}
        
        <div className="p-6 overflow-y-auto flex-grow">
          {saveError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">{saveError}</div>}
          
          {!initialData && (
          <div className="mb-6 p-4 bg-[#faf9f7] rounded-2xl border border-[#efefef]">
            <label className="block text-xs font-semibold text-[#0068f9] mb-1">Smart Paste</label>
            <p className="text-xs text-[#777c86] mb-3">Paste a job description here to automatically fill out the {trackingSystem === 'academic' ? 'institution, title' : 'company, position'}, and notes.</p>
            <div className="flex flex-col gap-2">
              <textarea 
                value={pasteText} 
                onChange={e => setPasteText(e.target.value)} 
                rows={3} 
                placeholder="Paste job description..."
                className="w-full px-3.5 py-2.5 border border-[#efefef] rounded-2xl bg-white focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] resize-y"
              />
              {extractError && <div className="text-red-500 text-xs font-medium">{extractError}</div>}
              <button 
                type="button" 
                onClick={handleExtract}
                disabled={isExtracting || !pasteText.trim()}
                className={`self-start gap-2 inline-flex items-center justify-center rounded-full text-xs font-medium transition-all border border-[#efefef] bg-white text-[#121722] shadow-2xs hover:bg-[#faf9f7] h-9 px-4 py-2 cursor-pointer ${(isExtracting || !pasteText.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin text-[#0068f9]" /> : <Wand2 size={16} className="text-[#0068f9]" />}
                {isExtracting ? 'Extracting...' : 'Auto-fill fields'}
              </button>
            </div>
          </div>
        )}
        <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">{trackingSystem === 'academic' ? 'Institution / University' : 'Company'} *</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">{trackingSystem === 'academic' ? 'Academic Title / Position' : 'Position'} *</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" />
            </div>
            {/* 2-Level Location Selection */}
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-medium text-[#777c86]">Location</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Level 1: Country Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={e => handleCountrySelect(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] appearance-none cursor-pointer"
                  >
                    <option value="">Select Country...</option>
                    {LOCATION_DATA.map(g => (
                      <option key={g.country} value={g.country}>{g.country}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
                </div>

                {/* Level 2: City & Province Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={e => handleCitySelect(e.target.value)}
                    disabled={!selectedCountry}
                    className="w-full pl-3.5 pr-9 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{selectedCountry ? 'Select City / State...' : 'Select Country First'}</option>
                    {currentCountryGroup?.cities.map(c => (
                      <option key={c.label} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
                </div>
              </div>

              {/* Custom Location Details if Custom option is chosen */}
              {(selectedCity.startsWith('custom_') || selectedCountry === 'Other Country') && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customCityText}
                    onChange={e => handleCustomCityChange(e.target.value)}
                    placeholder="Enter custom city or province details"
                    className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">Work type</label>
              <div className="relative">
                <select name="workType" value={formData.workType || ''} onChange={handleChange} className="w-full pl-3.5 pr-9 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] appearance-none cursor-pointer">
                  <option value="">Select work type...</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">Status</label>
              <div className="relative">
                <select name="status" value={formData.status || 'Applied'} onChange={handleChange} className="w-full pl-3.5 pr-9 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] appearance-none cursor-pointer">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">Applied Date</label>
              <input type="date" name="appliedDate" value={formData.appliedDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className={`w-full px-3.5 py-2 border rounded-2xl bg-[#faf9f7] focus:ring-1 outline-none transition-all text-xs text-[#121722] ${isPastInterview ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200' : 'border-[#efefef] focus:border-[#0068f9] focus:ring-[#0068f9]'}`} />
              {isPastInterview && <p className="text-[10px] text-amber-600 mt-1">This time is in the past. Reminders cannot be set.</p>}
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-medium text-[#777c86] mb-1">Reminder</label>
              <div className="relative">
                <select name="reminder" value={(formData.nextInterviewDate && !isPastInterview) ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate || isPastInterview} className="w-full pl-3.5 pr-9 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer">
                  <option value="none">None</option>
                  <option value="15 mins">15 mins before</option>
                  <option value="1 hour">1 hour before</option>
                  <option value="2 hours">2 hours before</option>
                  <option value="1 day">1 day before</option>
                  <option value="2 days">2 days before</option>
                  <option value="custom">Custom</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
              </div>
              {formData.reminder === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="date" name="customReminderDate" value={formData.customReminderDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" placeholder="Start Date" />
                  <span className="text-[#777c86] text-xs">to</span>
                  <input type="date" name="customReminderEndDate" value={formData.customReminderEndDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" placeholder="End Date" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#777c86] mb-1">Contact Email</label>
              <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777c86] mb-1">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full px-3.5 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722]"></textarea>
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
              isDemo={isDemo}
            />
          </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-[#efefef] bg-[#faf9f7] shrink-0 flex justify-between items-center">
          {initialData && onDelete ? (
              <button 
                type="button" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (isDemo) {
                    toast.info('Demo Mode: Deleting applications is restricted in this portfolio preview.');
                    return;
                  }
                  onDelete(initialData.id); 
                }} 
                className="text-red-500 hover:text-red-600 font-medium text-xs cursor-pointer"
              >
                Delete
              </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] h-9 px-5 py-2 shadow-2xs cursor-pointer">
              Cancel
            </button>
            <button 
              type="submit" 
              form="job-form" 
              disabled={isSaving} 
              className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-9 px-5 py-2 cursor-pointer"
            >
              {isDemo ? 'Read-Only (Demo)' : isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
