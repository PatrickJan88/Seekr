const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

// Replace import to include UploadedFile
content = content.replace(
  "import { FileUpload } from './FileUpload';",
  "import { FileUpload, UploadedFile } from './FileUpload';"
);

// Replace handleFileUpload
const searchHandleFileUpload = `  const handleFileUpload = (file: File | null, field: 'resumeUrl') => {
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

const replaceHandleFileUpload = `  const handleAttachmentsChange = (files: UploadedFile[]) => {
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
          id: \`att-\${idx}\`,
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
  }, [initialData]);`;

content = content.replace(searchHandleFileUpload, replaceHandleFileUpload);

// Update FileUpload usage
const searchFileUploadUsage = `          <div className="grid grid-cols-1 gap-4 mt-2">
            <FileUpload 
              label="Attachments" 
              accept=".pdf,.doc,.docx" 
              maxSizeMB={5}
              initialFileName={formData.resumeUrl ? "Attached_File" : undefined}
              onFileSelect={(file) => handleFileUpload(file, 'resumeUrl')} 
            />
          </div>`;

const replaceFileUploadUsage = `          <div className="grid grid-cols-1 gap-4 mt-2">
            <FileUpload 
              label="Attachments" 
              accept=".pdf,.doc,.docx" 
              maxSizeMB={5}
              maxFiles={5}
              initialFiles={initialFiles}
              onFilesChange={handleAttachmentsChange} 
            />
          </div>`;

content = content.replace(searchFileUploadUsage, replaceFileUploadUsage);

fs.writeFileSync('src/components/JobForm.tsx', content);
