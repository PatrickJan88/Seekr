import React, { useState } from 'react';
import { X, Printer, Edit2, Copy, Check, Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewPrepStudioProps {
  initialText: string;
  companyName?: string;
  targetRole?: string;
  onClose: () => void;
}

export function InterviewPrepStudio({ initialText, companyName, targetRole, onClose }: InterviewPrepStudioProps) {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Interview prep guide copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print or save PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${companyName ? companyName + ' - ' : ''}Interview Prep Guide</title>
          <style>
            @page { size: letter; margin: 0.5in; }
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              font-size: 10pt; 
              line-height: 1.55; 
              color: #1e293b; 
              padding: 0.5in; 
              margin: 0; 
              max-width: 8.5in;
            }
            .header {
              border-bottom: 2px solid #0068f9;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            h1 { font-size: 18pt; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 11pt; color: #0068f9; font-weight: 600; margin-top: 4px; }
            .content { 
              white-space: pre-wrap; 
              font-family: inherit;
            }
            @media print {
              html, body {
                width: 8.5in;
                min-height: 11in;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Interview Preparation & Strategy Guide</h1>
            <div class="subtitle">${targetRole ? targetRole + ' ' : ''}${companyName ? '• ' + companyName : ''}</div>
          </div>
          <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <script>
            window.onload = () => { 
              window.print(); 
              setTimeout(() => window.close(), 500); 
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-[#121722]/50 backdrop-blur-xs z-[200] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-in fade-in duration-200">
      <div className="bg-[#faf9f7] rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#efefef]">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-[#efefef] shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f4f0ff] text-[#6736eb] flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#121722]">Interview Prep Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f4f0ff] text-[#6736eb]">
                  Resume-Grounded
                </span>
              </div>
              <p className="text-xs text-[#777c86]">
                {companyName ? `Tailored strategy for ${companyName}` : 'Interview strategy & STAR responses'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#efefef] hover:bg-[#faf9f7] text-[#121722] text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0068f9] text-white text-xs font-semibold rounded-full hover:bg-[#024bb1] transition-all shadow-2xs cursor-pointer"
            >
              <Printer size={15} />
              <span>Export PDF</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#efefef] rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center bg-[#f4f5f6] custom-scrollbar">
          <div className="w-full max-w-3xl bg-white shadow-md border border-[#e2e8f0] p-8 sm:p-12 min-h-[10.5in] relative rounded-sm">
            <div className="absolute top-4 right-4 text-[#a5a5a5] pointer-events-none flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
              <Edit2 size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Document</span>
            </div>

            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              className="w-full min-h-[9in] bg-transparent resize-none focus:outline-none font-sans text-[#121722] text-sm leading-relaxed"
              spellCheck="false"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
