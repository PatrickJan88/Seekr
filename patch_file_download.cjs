const fs = require('fs');

let fileUpload = fs.readFileSync('src/components/FileUpload.tsx', 'utf8');

// Add handleDownload function
const handleDownloadCode = `
  const handleDownload = (fileObj: UploadedFile) => {
    const url = fileObj.base64 || fileObj.url;
    if (!url) return;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
`;

fileUpload = fileUpload.replace(
  '  const formatFileSize = (bytes: number) => {',
  handleDownloadCode + '\n  const formatFileSize = (bytes: number) => {'
);

// Update rendering of files for hover and click download
const originalCard = `<Card key={fileObj.id} className="relative bg-slate-50 p-4 border-slate-200">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-slate-400 hover:text-slate-600 rounded-md bg-transparent"
                onClick={() => removeFile(fileObj.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3 pr-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
                  <File className="h-5 w-5 text-slate-500" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {fileObj.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fileObj.file ? formatFileSize(fileObj.file.size) : 'Uploaded previously'}
                  </p>
                </div>
              </div>`;

const modifiedCard = `<Card 
              key={fileObj.id} 
              className="relative bg-slate-50 p-4 border-slate-200 group cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
              onClick={() => handleDownload(fileObj)}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-slate-400 hover:text-slate-600 rounded-md bg-transparent z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(fileObj.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3 pr-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                  <File className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                    {fileObj.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                    {fileObj.file ? formatFileSize(fileObj.file.size) : 'Uploaded previously'}
                  </p>
                </div>
              </div>`;

// Replace whitespace carefully or simply use literal match by regex if easier. Let's do it robustly.
fileUpload = fileUpload.replace(/<Card key={fileObj\.id} className="relative bg-slate-50 p-4 border-slate-200">[\s\S]*?<div className="flex-1 min-w-0">[\s\S]*?<\/div>\s*<\/div>/, modifiedCard);

fs.writeFileSync('src/components/FileUpload.tsx', fileUpload);
