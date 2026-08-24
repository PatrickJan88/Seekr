import React, { useState } from 'react';
import { X, Printer, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewPrepStudioProps {
  initialText: string;
  companyName?: string;
  onClose: () => void;
}

export function InterviewPrepStudio({ initialText, companyName, onClose }: InterviewPrepStudioProps) {
  const [text, setText] = useState(initialText);

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
          <title>\${companyName ? companyName + ' - ' : ''}Interview Prep Guide</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 11pt; 
              line-height: 1.6; 
              color: #000; 
              padding: 1in; 
              margin: 0; 
              max-width: 8.5in;
              box-sizing: border-box;
            }
            .content { 
              white-space: pre-wrap; 
            }
            h1, h2, h3 { color: #121722; font-family: 'Arial', sans-serif; }
            @page { size: letter; margin: 0; }
            @media print {
              html, body {
                width: 8.5in;
                height: 11in;
              }
            }
          </style>
        </head>
        <body>
          <h2>\${companyName ? companyName + ' - ' : ''}Interview Prep Guide</h2>
          <div class="content">\${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
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
    <div className="fixed inset-0 bg-[#121722]/40 backdrop-blur-xs z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#faf9f7] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#efefef]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-[#efefef] shrink-0">
           <div>
             <h2 className="text-xl font-bold text-[#121722]">Interview Prep Studio</h2>
             <p className="text-sm text-[#777c86]">Customize and export your tailored interview prep guide.</p>
           </div>
           <div className="flex items-center gap-3">
             <button 
               onClick={handlePrint}
               className="inline-flex items-center gap-2 px-4 py-2 bg-[#0068f9] text-white text-sm font-medium rounded-full hover:bg-[#024bb1] transition-all shadow-2xs"
             >
               <Printer size={16} />
               <span>Export PDF</span>
             </button>
             <button 
               onClick={onClose}
               className="p-2 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#efefef] rounded-full transition-colors"
             >
               <X size={20} />
             </button>
           </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto flex justify-center custom-scrollbar">
           <div className="w-full max-w-3xl bg-white shadow-sm border border-[#efefef] min-h-[11in] relative">
              <div className="absolute top-4 right-4 text-[#a5a5a5] pointer-events-none flex items-center gap-2">
                 <Edit2 size={16} />
                 <span className="text-xs font-medium uppercase tracking-wider">Editable Document</span>
              </div>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)}
                className="w-full h-full min-h-[11in] p-12 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-[#0068f9]/30 font-sans text-[#121722] text-sm leading-relaxed"
                spellCheck="false"
              />
           </div>
        </div>

      </div>
    </div>
  );
}
