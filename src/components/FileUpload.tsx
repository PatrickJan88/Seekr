import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { File, X } from "lucide-react";
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
}

export function FileUpload({ label, onFilesChange, accept = ".pdf,.doc,.docx", maxSizeMB = 10, maxFiles = 5, initialFiles = [], description }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  
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
        progress: 0,
        uploading: true,
      };
    }).filter(Boolean) as UploadedFile[];

    if (newUploadedFiles.length === 0) return;

    setFiles(prev => {
      const updatedFiles = [...prev, ...newUploadedFiles];
      return updatedFiles;
    });

    for (const fileObj of newUploadedFiles) {
      if (fileObj.file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles(prev => {
            const updated = prev.map(f => {
              if (f.id === fileObj.id) {
                return { ...f, progress: 100, uploading: false, base64: reader.result as string };
              }
              return f;
            });
            return updated;
          });
        };
        let p = 0;
        const interval = setInterval(() => {
          p += 20;
          if (p >= 100) {
            clearInterval(interval);
            reader.readAsDataURL(fileObj.file as File);
          } else {
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: p } : f));
          }
        }, 100);
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
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      return updated;
    });
  };


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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-xs font-bold text-slate-400">{label}</label>
        <span className="text-xs text-slate-400">{files.length} / {maxFiles}</span>
      </div>

      {files.length < maxFiles && (
        <div
          className="flex justify-center rounded-xl border mt-2 border-dashed border-slate-300 px-6 py-6 hover:bg-slate-50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div>
            <File
              className="mx-auto h-8 w-8 text-slate-400 mb-2"
              aria-hidden={true}
            />
            <div className="flex text-sm leading-6 text-slate-600 justify-center">
              <p>Drag and drop or</p>
              <label
                className="relative cursor-pointer rounded-sm pl-1 font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>choose files</span>
                <input
                  type="file"
                  className="sr-only"
                  accept={accept}
                  multiple
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-center text-slate-500">
              {description || `Accepted: ${accept}. Max: ${maxSizeMB}MB.`}
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {files.map(fileObj => (
            <Card 
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
              </div>

              {(fileObj.uploading || fileObj.progress < 100) && (
                <div className="flex items-center space-x-3 mt-4">
                  <Progress value={fileObj.progress} className="h-1.5 flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500 font-medium w-8 text-right">{fileObj.progress}%</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
