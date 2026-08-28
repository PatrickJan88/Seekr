import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { File, X, Image as ImageIcon, Eye, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

export interface UploadedFile {
  id: string;
  file?: File;
  fileName: string;
  progress: number;
  uploading: boolean;
  base64?: string;
  url?: string;
}

export interface FileUploadProps {
  label: string;
  onFilesChange?: (files: UploadedFile[]) => void;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  initialFiles?: UploadedFile[];
  description?: string;
  isDemo?: boolean;
}

interface FileItemCardProps {
  fileObj: UploadedFile;
  isDemo: boolean;
  onDownload: () => void;
  onRemove: () => void;
  onPreview: () => void;
  formatFileSize: (bytes: number) => string;
}

/**
 * Compresses an image file client-side using Canvas to ensure clean storage and eliminate Firestore payload limits.
 */
const compressImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // High quality compressed jpeg (typically 40KB - 90KB)
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

const FileItemCard: React.FC<FileItemCardProps> = ({
  fileObj,
  isDemo,
  onDownload,
  onRemove,
  onPreview,
  formatFileSize
}) => {
  const isImage = React.useMemo(() => {
    if (fileObj.file?.type?.startsWith('image/')) return true;
    if (fileObj.base64 && fileObj.base64.startsWith('data:image/')) return true;
    if (fileObj.url && (fileObj.url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(fileObj.url))) return true;
    if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(fileObj.fileName)) return true;
    return false;
  }, [fileObj.file, fileObj.base64, fileObj.url, fileObj.fileName]);

  const previewUrl = React.useMemo(() => {
    if (fileObj.base64 && fileObj.base64.startsWith('data:image/')) return fileObj.base64;
    if (fileObj.url && (fileObj.url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)/i.test(fileObj.url))) return fileObj.url;
    return null;
  }, [fileObj.base64, fileObj.url]);

  return (
    <div className="relative group">
      <Card 
        className="relative bg-[#faf9f7] p-3.5 border-[#efefef] rounded-2xl hover:border-[#0068f9]/30 hover:bg-white transition-all shadow-2xs"
      >
        <div className="flex items-center justify-between gap-3">
          <div 
            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
            onClick={onPreview}
          >
            {isImage && previewUrl ? (
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-[#efefef] group-hover:border-[#0068f9]/40 overflow-hidden transition-colors">
                <img
                  src={previewUrl}
                  alt={fileObj.fileName}
                  className="h-full w-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </span>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-[#efefef] group-hover:border-[#0068f9]/30 group-hover:text-[#0068f9] transition-colors">
                <File className="h-5 w-5 text-[#777c86] group-hover:text-[#0068f9] transition-colors" />
              </span>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#121722] truncate group-hover:text-[#0068f9] transition-colors">
                {fileObj.fileName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#777c86] transition-colors">
                {fileObj.file ? formatFileSize(fileObj.file.size) : 'Ready'}
              </p>
            </div>
          </div>

          {/* Action buttons including Eye preview, Download, and Remove */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              title="Preview file"
              className="p-1.5 rounded-lg text-[#777c86] hover:text-[#0068f9] hover:bg-[#eef5ff] transition-all cursor-pointer"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              title="Download file"
              className="p-1.5 rounded-lg text-[#777c86] hover:text-[#0068f9] hover:bg-[#eef5ff] transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>

            {!isDemo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                title="Remove attachment"
                className="p-1.5 rounded-lg text-[#777c86] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {(fileObj.uploading || fileObj.progress < 100) && (
          <div className="flex items-center space-x-3 mt-3">
            <Progress value={fileObj.progress} className="h-1.5 flex-1 bg-[#efefef]" />
            <span className="text-xs text-[#777c86] font-medium w-8 text-right">{fileObj.progress}%</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export function FileUpload({ 
  label, 
  onFilesChange, 
  accept = ".pdf,.doc,.docx", 
  maxSizeMB = 10, 
  maxFiles = 5, 
  initialFiles = [], 
  description, 
  isDemo = false 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onFilesChangeRef = useRef(onFilesChange);

  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  const prevFilesRef = useRef(initialFiles);
  useEffect(() => {
    if (files !== prevFilesRef.current) {
      if (onFilesChangeRef.current) {
        onFilesChangeRef.current(files);
      }
      prevFilesRef.current = files;
    }
  }, [files]);

  const handleFiles = async (newFiles: FileList | File[] | null | undefined) => {
    if (isDemo) {
      toast.info('Demo Mode: File attachment uploads are disabled in this portfolio preview.');
      return;
    }
    if (!newFiles || newFiles.length === 0) return;

    const filesArray = Array.from(newFiles);
    
    if (files.length + filesArray.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    const newUploadedFiles = filesArray.map(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds ${maxSizeMB}MB`);
        return null;
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        fileName: file.name,
        progress: 10,
        uploading: true,
      };
    }).filter(Boolean) as UploadedFile[];

    if (newUploadedFiles.length === 0) return;

    setFiles(prev => [...prev, ...newUploadedFiles]);

    for (const fileObj of newUploadedFiles) {
      if (fileObj.file) {
        try {
          const isImg = fileObj.file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(fileObj.fileName);
          let base64Result = '';
          
          if (isImg) {
            base64Result = await compressImageFile(fileObj.file);
          } else {
            base64Result = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onload = () => res(reader.result as string);
              reader.onerror = () => res('');
              reader.readAsDataURL(fileObj.file as File);
            });
          }

          setFiles(prev => prev.map(f => {
            if (f.id === fileObj.id) {
              return { 
                ...f, 
                progress: 100, 
                uploading: false, 
                base64: base64Result 
              };
            }
            return f;
          }));
        } catch {
          setFiles(prev => prev.map(f => {
            if (f.id === fileObj.id) {
              return { ...f, progress: 100, uploading: false };
            }
            return f;
          }));
        }
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    if (isDemo) {
      toast.info('Demo Mode: Removing attachments is disabled in this portfolio preview.');
      return;
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDownload = (fileObj: UploadedFile) => {
    const url = fileObj.base64 || fileObj.url;
    if (!url) {
      toast.error('File content is not available for download.');
      return;
    }
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.fileName || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-xs font-semibold text-[#121722]">{label}</label>
        <span className="text-xs text-[#777c86]">{files.length} / {maxFiles}</span>
      </div>

      {files.length < maxFiles && (
        isDemo ? (
          <div
            className="flex justify-center rounded-2xl border mt-2 border-dashed border-[#efefef] bg-[#faf9f7] px-6 py-5 text-center cursor-not-allowed select-none"
            onClick={() => toast.info('Demo Mode: File attachment uploads are disabled in this portfolio preview.')}
          >
            <div>
              <File
                className="mx-auto h-7 w-7 text-[#777c86] mb-1.5"
                aria-hidden={true}
              />
              <p className="text-xs font-medium text-[#121722]">
                Choose files disabled in Portfolio Demo Mode
              </p>
              <p className="mt-0.5 text-[11px] text-[#777c86]">
                {description || `Accepted: ${accept}. Max: ${maxSizeMB}MB.`}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center rounded-2xl border mt-1 border-dashed border-[#d5d7da] hover:border-[#0068f9]/40 bg-[#faf9f7] hover:bg-white px-6 py-5 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div>
              <File
                className="mx-auto h-7 w-7 text-[#777c86] mb-1.5 pointer-events-none"
                aria-hidden={true}
              />
              <div className="flex text-xs text-[#777c86] justify-center items-center gap-1">
                <span>Drag and drop or</span>
                <span className="font-semibold text-[#0068f9] hover:underline">choose files</span>
                <input
                  type="file"
                  className="sr-only"
                  accept={accept}
                  multiple
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </div>
              <p className="mt-1 text-[11px] text-center text-[#777c86]">
                {description || `Accepted: ${accept}. Max: ${maxSizeMB}MB.`}
              </p>
            </div>
          </div>
        )
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {files.map(fileObj => (
            <FileItemCard
              key={fileObj.id}
              fileObj={fileObj}
              isDemo={isDemo}
              onDownload={() => handleDownload(fileObj)}
              onRemove={() => removeFile(fileObj.id)}
              onPreview={() => setPreviewFile(fileObj)}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}

      {/* Full Preview Lightbox Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#efefef] bg-[#faf9f7]">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <span className="p-1.5 rounded-lg bg-white border border-[#efefef] text-[#0068f9]">
                  <File className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-[#121722] truncate">
                  {previewFile.fileName}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDownload(previewFile)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#121722] hover:text-[#0068f9] bg-white hover:bg-[#eef5ff] px-3 py-1.5 rounded-xl border border-[#efefef] transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-xl text-[#777c86] hover:text-[#121722] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-50 min-h-[260px] max-h-[65vh]">
              {((previewFile.base64 && previewFile.base64.startsWith('data:image/')) || 
                (previewFile.url && (previewFile.url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)/i.test(previewFile.url))) || 
                /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(previewFile.fileName)) ? (
                <img
                  src={previewFile.base64 || previewFile.url}
                  alt={previewFile.fileName}
                  className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-sm">
                  <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0068f9] mb-3">
                    <File className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-sm text-[#121722] mb-1 truncate max-w-[260px]">
                    {previewFile.fileName}
                  </h4>
                  <p className="text-xs text-[#777c86] mb-4">
                    Preview is not available for this file type. You can download it to view locally.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewFile)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0068f9] hover:bg-[#024bb1] px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
