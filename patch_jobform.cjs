const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

// Add import
content = content.replace(
  "import { Loader2, Wand2 } from 'lucide-react';",
  "import { Loader2, Wand2 } from 'lucide-react';\nimport { FileUpload } from './FileUpload';"
);

// Add handleFileUpload
const searchHandleFileChange = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'resumeUrl' | 'coverLetterUrl') => {
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
  };`;

const replaceHandleFileUpload = `  const handleFileUpload = (file: File | null, field: 'resumeUrl' | 'coverLetterUrl') => {
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
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };`;

content = content.replace(searchHandleFileChange, replaceHandleFileUpload);

const searchFiles = `          <div className="grid grid-cols-2 gap-4">
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
          </div>`;

const replaceFiles = `          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <FileUpload 
              label="Resume" 
              accept=".pdf,.doc,.docx" 
              maxSizeMB={2}
              initialFileName={formData.resumeUrl ? "Attached_Resume" : undefined}
              onFileSelect={(file) => handleFileUpload(file, 'resumeUrl')} 
            />
            <FileUpload 
              label="Cover Letter" 
              accept=".pdf,.doc,.docx" 
              maxSizeMB={2}
              initialFileName={formData.coverLetterUrl ? "Attached_CoverLetter" : undefined}
              onFileSelect={(file) => handleFileUpload(file, 'coverLetterUrl')} 
            />
          </div>`;

content = content.replace(searchFiles, replaceFiles);

fs.writeFileSync('src/components/JobForm.tsx', content);
