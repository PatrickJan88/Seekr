import React, { useState } from 'react';
import { X, Download, Printer, Edit2, Copy, Check, Sparkles, FileText, Layout } from 'lucide-react';
import { toast } from 'sonner';

interface CoverLetterStudioProps {
  initialText: string;
  companyName?: string;
  targetRole?: string;
  onClose: () => void;
}

type CoverLetterStyle = 'classic' | 'modern' | 'executive' | 'academic';

export function CoverLetterStudio({ initialText, companyName, targetRole, onClose }: CoverLetterStudioProps) {
  const [text, setText] = useState(initialText);
  const [style, setStyle] = useState<CoverLetterStyle>('modern');
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Cover letter copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print or save PDF.');
      return;
    }

    let fontStyle = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5pt; line-height: 1.6; color: #1e293b; padding: 0.8in;";
    let accentHeader = "";

    if (style === 'classic') {
      fontStyle = "font-family: 'Times New Roman', Georgia, serif; font-size: 11pt; line-height: 1.6; color: #111; padding: 1in;";
    } else if (style === 'executive') {
      fontStyle = "font-family: 'Georgia', serif; font-size: 10.5pt; line-height: 1.65; color: #0f172a; padding: 0.85in;";
      accentHeader = `<div style="border-top: 3px solid #0068f9; margin-bottom: 20px;"></div>`;
    } else if (style === 'academic') {
      fontStyle = "font-family: 'Computer Modern', 'Times New Roman', serif; font-size: 11pt; line-height: 1.7; color: #000; padding: 1in;";
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${companyName ? companyName + ' - ' : ''}Cover Letter</title>
          <style>
            @page { size: letter; margin: 0; }
            * { box-sizing: border-box; }
            body { 
              ${fontStyle}
              margin: 0; 
              max-width: 8.5in;
            }
            .content { 
              white-space: pre-wrap; 
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
          ${accentHeader}
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
    <div className="fixed inset-0 bg-[#121722]/50 backdrop-blur-xs z-[300] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-in fade-in duration-200">
      <div className="bg-[#faf9f7] rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#efefef]">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-[#efefef] shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#121722]">Cover Letter Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f1ff] text-[#0068f9]">
                  One-Click Tailored
                </span>
              </div>
              <p className="text-xs text-[#777c86]">
                {companyName ? `Tailored for ${companyName}` : 'Custom cover letter'} • {wordCount} words • ~{readTime} min read
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Style Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium mr-1">
              <button
                type="button"
                onClick={() => setStyle('modern')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${style === 'modern' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
              >
                Modern
              </button>
              <button
                type="button"
                onClick={() => setStyle('classic')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${style === 'classic' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
              >
                Classic
              </button>
              <button
                type="button"
                onClick={() => setStyle('executive')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${style === 'executive' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
              >
                Executive
              </button>
            </div>

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

        {/* Editor Paper Canvas Area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center bg-[#f4f5f6] custom-scrollbar">
          <div className="w-full max-w-3xl bg-white shadow-md border border-[#e2e8f0] p-8 sm:p-12 min-h-[10.5in] relative rounded-sm">
            <div className="absolute top-4 right-4 text-[#a5a5a5] pointer-events-none flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
              <Edit2 size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Document</span>
            </div>

            {style === 'executive' && (
              <div className="w-full h-1 bg-[#0068f9] rounded-full mb-6" />
            )}

            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              className={`w-full min-h-[9in] bg-transparent resize-none focus:outline-none text-[#121722] text-sm sm:text-base leading-relaxed ${
                style === 'classic' ? 'font-serif' : style === 'executive' ? 'font-serif' : 'font-sans'
              }`}
              spellCheck="false"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
