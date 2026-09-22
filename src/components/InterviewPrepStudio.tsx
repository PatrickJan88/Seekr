import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Printer, Copy, Check, BookOpen, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toolbar } from './ui/toolbar';
import { markdownOrTextToHtml, executeRichTextCommand, queryEditorState, paginateHtml, normalizeUrl } from '../lib/editor-utils';

interface InterviewPrepStudioProps {
  initialText: string;
  companyName?: string;
  targetRole?: string;
  onClose?: () => void;
  embedded?: boolean;
  onSave?: (savedText: string) => void;
  storageKey?: string;
}

export function InterviewPrepStudio({ 
  initialText, 
  companyName, 
  targetRole, 
  onClose, 
  embedded = false,
  onSave,
  storageKey 
}: InterviewPrepStudioProps) {
  const [copied, setCopied] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [activeButtons, setActiveButtons] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastValidHtmlRef = useRef<string[]>([]);
  const pagesContentRef = useRef<string[]>([]);
  const statsDebounceRef = useRef<any>(null);
  const autoSaveDebounceRef = useRef<any>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const isInitializedRef = useRef<string | null>(null);

  const fallbackKey = `studio_interview_prep_${(companyName || 'general').replace(/\s+/g, '_')}_${(targetRole || 'general').replace(/\s+/g, '_')}`;
  const effectiveStorageKey = storageKey || fallbackKey;

  // Snapshot current DOM innerHTML or ref memory of all pages
  const snapshotDomPages = useCallback((): string[] => {
    const count = Math.max(pages.length, pagesContentRef.current.length, lastValidHtmlRef.current.length, 1);
    const result: string[] = [];
    for (let idx = 0; idx < count; idx++) {
      const el = pageRefs.current[idx];
      const domHtml = (el && el.innerHTML && el.innerHTML.trim() !== '<p><br></p>') ? el.innerHTML : null;
      const refHtml = pagesContentRef.current[idx] || lastValidHtmlRef.current[idx];
      const stateHtml = pages[idx];

      const chosen = domHtml || refHtml || stateHtml || '<p><br></p>';
      result.push(chosen);
      pagesContentRef.current[idx] = chosen;
      lastValidHtmlRef.current[idx] = chosen;
    }
    return result;
  }, [pages]);

  // Debounced auto-save engine: persists to localStorage and invokes onSave callback
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    // Immediate synchronous persistence to localStorage so no quick navigation can ever lose it
    const currentPages = snapshotDomPages();
    const combinedHtml = currentPages.join('');
    try {
      localStorage.setItem(effectiveStorageKey, combinedHtml);
      localStorage.setItem(`${effectiveStorageKey}_pages`, JSON.stringify(currentPages));
    } catch (e) {
      console.warn('InterviewPrepStudio auto-save to localStorage failed:', e);
    }

    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(() => {
      if (onSaveRef.current) {
        onSaveRef.current(combinedHtml);
      }
      setSaveStatus('saved');
    }, 400);
  }, [effectiveStorageKey, snapshotDomPages]);

  // Manual save trigger for immediate persistence
  const handleManualSave = useCallback(() => {
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    setSaveStatus('saving');
    const currentPages = snapshotDomPages();
    const combinedHtml = currentPages.join('');
    try {
      localStorage.setItem(effectiveStorageKey, combinedHtml);
      localStorage.setItem(`${effectiveStorageKey}_pages`, JSON.stringify(currentPages));
    } catch (e) {}
    if (onSaveRef.current) {
      onSaveRef.current(combinedHtml);
    }
    setSaveStatus('saved');
    toast.success('Interview guide auto-saved successfully!');
  }, [effectiveStorageKey, snapshotDomPages]);

  // Initialize with initial text or stored draft ONCE per storageKey
  useEffect(() => {
    if (isInitializedRef.current === effectiveStorageKey) {
      return;
    }
    isInitializedRef.current = effectiveStorageKey;

    let textToUse = initialText;
    let savedPagesList: string[] | null = null;
    try {
      const saved = localStorage.getItem(effectiveStorageKey) || (fallbackKey !== effectiveStorageKey ? localStorage.getItem(fallbackKey) : null);
      if (saved && saved.trim() && saved.length > 10) {
        textToUse = saved;
      }
      const rawPages = localStorage.getItem(`${effectiveStorageKey}_pages`) || (fallbackKey !== effectiveStorageKey ? localStorage.getItem(`${fallbackKey}_pages`) : null);
      if (rawPages) {
        const parsed = JSON.parse(rawPages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedPagesList = parsed;
        }
      }
    } catch (e) {}

    if (savedPagesList && savedPagesList.length > 0) {
      setPages(savedPagesList);
      pagesContentRef.current = [...savedPagesList];
      lastValidHtmlRef.current = [...savedPagesList];
      setActivePageIndex(0);
      setTimeout(() => {
        savedPagesList!.forEach((html, i) => {
          const el = pageRefs.current[i];
          if (el) {
            el.innerHTML = html;
            lastValidHtmlRef.current[i] = html;
            pagesContentRef.current[i] = html;
          }
        });
        debouncedUpdateWordCount();
      }, 30);
      return;
    }

    const initialHtml = markdownOrTextToHtml(textToUse);
    setPages([initialHtml]);
    pagesContentRef.current = [initialHtml];
    lastValidHtmlRef.current = [initialHtml];
    setActivePageIndex(0);

    const timer = setTimeout(() => {
      const el0 = pageRefs.current[0];
      if (el0) {
        const paginatedPages = paginateHtml(el0, initialHtml);
        if (paginatedPages.length > 1) {
          setPages(paginatedPages);
          pagesContentRef.current = [...paginatedPages];
          lastValidHtmlRef.current = [...paginatedPages];
          setTimeout(() => {
            paginatedPages.forEach((html, i) => {
              const el = pageRefs.current[i];
              if (el) {
                el.innerHTML = html;
                lastValidHtmlRef.current[i] = html;
                pagesContentRef.current[i] = html;
              }
            });
            debouncedUpdateWordCount();
          }, 30);
        } else {
          el0.innerHTML = initialHtml;
          lastValidHtmlRef.current[0] = initialHtml;
          pagesContentRef.current[0] = initialHtml;
          debouncedUpdateWordCount();
        }
      }
    }, 40);

    return () => {
      clearTimeout(timer);
      if (statsDebounceRef.current) clearTimeout(statsDebounceRef.current);
    };
  }, [effectiveStorageKey, initialText, fallbackKey]);

  // Flush any pending auto-save on unmount safely using pagesContentRef
  useEffect(() => {
    return () => {
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current);
      }
      const count = Math.max(pagesContentRef.current.length, lastValidHtmlRef.current.length, pages.length, 1);
      const currentPages: string[] = [];
      for (let i = 0; i < count; i++) {
        const domEl = pageRefs.current[i];
        if (domEl && domEl.innerHTML && domEl.innerHTML.trim() !== '<p><br></p>') {
          currentPages.push(domEl.innerHTML);
        } else if (pagesContentRef.current[i]) {
          currentPages.push(pagesContentRef.current[i]);
        } else if (lastValidHtmlRef.current[i]) {
          currentPages.push(lastValidHtmlRef.current[i]);
        } else if (pages[i]) {
          currentPages.push(pages[i]);
        }
      }
      const combinedHtml = currentPages.join('');
      if (combinedHtml && combinedHtml.trim() && combinedHtml !== '<p><br></p>') {
        try {
          localStorage.setItem(effectiveStorageKey, combinedHtml);
          localStorage.setItem(`${effectiveStorageKey}_pages`, JSON.stringify(currentPages));
        } catch (e) {}
        if (onSaveRef.current) {
          onSaveRef.current(combinedHtml);
        }
      }
    };
  }, [effectiveStorageKey, pages]);

  // Synchronize DOM elements when pages array changes length (e.g. on add/remove)
  useEffect(() => {
    pages.forEach((html, idx) => {
      const el = pageRefs.current[idx];
      if (el && (!el.innerHTML || el.innerHTML === '<p><br></p>' || html !== '')) {
        if (el.innerHTML !== html) {
          el.innerHTML = html;
        }
      }
      lastValidHtmlRef.current[idx] = el?.innerHTML || html;
    });
    debouncedUpdateWordCount();
  }, [pages.length]);

  // High-performance debounced stats calculator across all page sheets
  const debouncedUpdateWordCount = useCallback(() => {
    if (statsDebounceRef.current) clearTimeout(statsDebounceRef.current);
    statsDebounceRef.current = setTimeout(() => {
      let totalWords = 0;
      pageRefs.current.forEach(el => {
        if (el) {
          const text = el.innerText || '';
          totalWords += text.trim().split(/\s+/).filter(Boolean).length;
        }
      });
      setWordCount(totalWords);
    }, 250);
  }, []);

  const updateToolbarSelection = useCallback(() => {
    const activeEditor = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (!activeEditor) return;
    const state = queryEditorState(activeEditor);
    setActiveButtons(state.activeButtons);
    if (state.textAlign) {
      setTextAlign(state.textAlign);
    }
  }, [activePageIndex]);

  const handlePageInput = (idx: number) => {
    debouncedUpdateWordCount();
    const el = pageRefs.current[idx];
    if (!el) return;

    // Strict boundary enforcement: content cannot exceed the bottom line
    if (el.scrollHeight > el.clientHeight + 1) {
      document.execCommand('undo');
      if (el.scrollHeight > el.clientHeight + 1 && lastValidHtmlRef.current[idx]) {
        el.innerHTML = lastValidHtmlRef.current[idx];
      }
      toast.warning('Bottom page boundary reached. Click "Add new page" below to add another page.', { id: 'page-limit' });
    } else {
      lastValidHtmlRef.current[idx] = el.innerHTML;
      pagesContentRef.current[idx] = el.innerHTML;
    }
    triggerAutoSave();
  };

  const handlePaste = (_e: React.ClipboardEvent<HTMLDivElement>, pageIndex: number) => {
    const el = pageRefs.current[pageIndex];
    if (!el) return;

    setTimeout(() => {
      if (el.scrollHeight > el.clientHeight + 1) {
        document.execCommand('undo');
        if (el.scrollHeight > el.clientHeight + 1 && lastValidHtmlRef.current[pageIndex]) {
          el.innerHTML = lastValidHtmlRef.current[pageIndex];
        }
        toast.warning('Pasted text exceeded the bottom line. Please click "Add new page" to extend.', { id: 'page-limit' });
        debouncedUpdateWordCount();
      } else {
        lastValidHtmlRef.current[pageIndex] = el.innerHTML;
        pagesContentRef.current[pageIndex] = el.innerHTML;
      }
      triggerAutoSave();
    }, 0);
  };

  const handleToolbarAction = (action: string, value?: string) => {
    const activeEditor = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (!activeEditor) return;
    const state = executeRichTextCommand(activeEditor, action, value);
    setActiveButtons(state.activeButtons);
    if (state.textAlign) {
      setTextAlign(state.textAlign);
    }
    pagesContentRef.current[activePageIndex] = activeEditor.innerHTML;
    lastValidHtmlRef.current[activePageIndex] = activeEditor.innerHTML;
    debouncedUpdateWordCount();
    triggerAutoSave();
    if (action === 'link') {
      toast.success(value ? `Link created: ${value}` : 'Link created successfully');
    } else if (action === 'unlink') {
      toast.info('Link removed');
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    setActivePageIndex(pageIndex);
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const rawHref = anchor.getAttribute('href') || anchor.href;
      if (rawHref) {
        const validUrl = normalizeUrl(rawHref);
        try {
          window.open(validUrl, '_blank', 'noopener,noreferrer');
        } catch {}
      }
    }
    updateToolbarSelection();
  };

  // Add one new page after the current active page (or at the end)
  const handleAddPage = (afterIndex?: number) => {
    const currentDomPages = snapshotDomPages();
    const insertAt = typeof afterIndex === 'number' ? afterIndex + 1 : currentDomPages.length;
    const nextPages = [...currentDomPages];
    nextPages.splice(insertAt, 0, '<p><br></p>');

    pagesContentRef.current = [...nextPages];
    lastValidHtmlRef.current = [...nextPages];
    setPages(nextPages);
    setActivePageIndex(insertAt);
    toast.success(`Page ${insertAt + 1} added below`);

    // Focus and scroll smoothly to the new page sheet
    setTimeout(() => {
      const newEl = pageRefs.current[insertAt];
      if (newEl) {
        newEl.innerHTML = '<p><br></p>';
        newEl.focus();
        newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      debouncedUpdateWordCount();
      triggerAutoSave();
    }, 100);
  };

  // Remove a specific page sheet
  const handleRemovePage = (indexToRemove: number) => {
    if (pages.length <= 1) return;
    const currentDomPages = snapshotDomPages();
    const nextPages = currentDomPages.filter((_, idx) => idx !== indexToRemove);

    pagesContentRef.current = [...nextPages];
    lastValidHtmlRef.current = [...nextPages];
    setPages(nextPages);
    const nextActive = Math.max(0, Math.min(activePageIndex, nextPages.length - 1));
    setActivePageIndex(nextActive);
    toast.info(`Page ${indexToRemove + 1} removed`);

    setTimeout(() => {
      nextPages.forEach((html, i) => {
        const el = pageRefs.current[i];
        if (el) el.innerHTML = html;
      });
      debouncedUpdateWordCount();
      triggerAutoSave();
    }, 50);
  };

  const handleCopy = () => {
    const texts = pageRefs.current
      .map(el => (el ? el.innerText.trim() : ''))
      .filter(Boolean);
    const combined = texts.join('\n\n');
    navigator.clipboard.writeText(combined);
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

    const currentDomPages = snapshotDomPages();
    const pagesHtml = currentDomPages.map((content, i) => `
      <div class="a4-page-sheet">
        ${i === 0 ? `
          <div class="header">
            <h1>Interview Preparation & Strategy Guide</h1>
            <div class="subtitle">${targetRole ? targetRole + ' ' : ''}${companyName ? '• ' + companyName : ''}</div>
          </div>
        ` : ''}
        <div class="content">${content}</div>
        <div class="page-footer-print">
          <span>Page ${i + 1} of ${currentDomPages.length}</span>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>
          <style>
            @page { 
              size: A4 portrait; 
              margin: 0; 
            }
            * { box-sizing: border-box; }
            html, body { 
              width: 210mm;
              margin: 0; 
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 10.5pt;
              line-height: 1.6;
              color: #1e293b;
            }
            .a4-page-sheet {
              width: 210mm;
              height: 296mm;
              max-height: 296mm;
              padding: 24mm 22mm 18mm 22mm;
              box-sizing: border-box;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
            }
            .a4-page-sheet:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .header {
              border-bottom: 2px solid #0068f9;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 18pt;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .header .subtitle {
              font-size: 11pt;
              color: #0068f9;
              font-weight: 600;
            }
            .content { 
              flex: 1;
              line-height: 1.7;
            }
            .content p { 
              margin-top: 0;
              margin-bottom: 1.25em; 
              line-height: 1.7;
            }
            .content p:last-child {
              margin-bottom: 0;
            }
            .content h1 { font-size: 16pt; font-weight: bold; margin: 0.8em 0 0.3em; color: #0f172a; }
            .content h2 { font-size: 13pt; font-weight: bold; margin: 0.7em 0 0.3em; color: #1e293b; }
            .content h3 { font-size: 11pt; font-weight: bold; margin: 0.6em 0 0.25em; color: #0068f9; }
            .content blockquote { border-left: 3px solid #0068f9; padding-left: 12px; margin: 0.8em 0; font-style: italic; color: #334155; }
            .content mark { background-color: #fef08a; padding: 0 2px; }
            .content a { color: #0068f9; text-decoration: underline; }
            .content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.85em; }
            .content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.85em; }
            .page-footer-print {
              display: flex;
              justify-content: flex-end;
              font-size: 8.5pt;
              color: #94a3b8;
              padding-top: 3mm;
            }
            @media print {
              html, body {
                width: 210mm;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
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

  const isAtBottomBoundary = (el: HTMLElement, nextRowNeeded: boolean = false): boolean => {
    // If scrollHeight strictly exceeds clientHeight + 2, content has already overflowed
    if (el.scrollHeight > el.clientHeight + 2) {
      return true;
    }

    const elRect = el.getBoundingClientRect();
    if (elRect.height <= 0) return false;

    let contentBottom = elRect.top;

    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rangeRect = range.getBoundingClientRect();
      if (rangeRect.height > 0) {
        contentBottom = Math.max(contentBottom, rangeRect.bottom);
      }
    } catch {
      // Ignore if range is empty
    }

    // Check last element child
    const lastChild = el.lastElementChild;
    if (lastChild) {
      const childRect = lastChild.getBoundingClientRect();
      if (childRect.height > 0 || childRect.bottom > 0) {
        contentBottom = Math.max(contentBottom, childRect.bottom);
      }
    }

    // Check current selection/caret
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const selRange = sel.getRangeAt(0);
      const selRect = selRange.getBoundingClientRect();
      if (selRect.bottom > 0) {
        contentBottom = Math.max(contentBottom, selRect.bottom);
      }
    }

    const spaceRemaining = elRect.bottom - contentBottom;

    if (nextRowNeeded) {
      // If we are requesting a new row / line break, check if at least ~18px remains
      return spaceRemaining < 18;
    }

    return spaceRemaining <= 2;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageIndex: number) => {
    e.stopPropagation();

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddPage(pageIndex);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
      return;
    }

    const el = pageRefs.current[pageIndex];
    if (!el) return;

    // Navigation, deletion, and standard edit shortcuts are always permitted
    const isNavOrDelete = 
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key.startsWith('Arrow') ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Escape' ||
      ((e.ctrlKey || e.metaKey) && ['z', 'y', 'a', 'c', 'x'].includes(e.key.toLowerCase()));

    if (isNavOrDelete) {
      return;
    }

    // 1. Enter key: Allow user to switch rows until reaching the bottom line boundary
    if (e.key === 'Enter') {
      if (isAtBottomBoundary(el, true)) {
        e.preventDefault();
        toast.warning('Bottom of page reached. Click "Add new page" below to add another page.', { id: 'page-limit' });
        return;
      }
    }

    // 2. Typing characters, spaces, etc.: Allow typing / wrapping rows until bottom line boundary
    const isTypingChar = !e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === ' ');
    if (isTypingChar) {
      if (isAtBottomBoundary(el, false)) {
        e.preventDefault();
        toast.warning('Bottom of page reached. Click "Add new page" below to add another page.', { id: 'page-limit' });
        return;
      }
    }
  };

  const studioBody = (
    <div className={`bg-[#faf9f7] rounded-2xl w-full flex flex-col overflow-hidden border border-[#efefef] ${
      embedded ? 'h-full min-h-[calc(100vh-140px)] shadow-2xs' : 'max-w-5xl h-[92vh] shadow-2xl'
    }`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-[#efefef] shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eef5ff] text-[#0068f9] flex items-center justify-center font-bold">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#121722]">Interview Prep Studio</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eef5ff] text-[#0068f9]">
                Resume-Grounded
              </span>
            </div>
            <p className="text-xs text-[#777c86] flex items-center gap-1.5 flex-wrap">
              <span>{companyName ? `Tailored strategy for ${companyName}` : 'Interview strategy & STAR responses'}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {pages.length === 1 ? '1 A4 Page' : `${pages.length} A4 Pages`}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handleManualSave}
                title="Auto-saves automatically. Click to save immediately."
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer select-none active:scale-95 ${
                  saveStatus === 'saving' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/70'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={11} className="animate-spin text-amber-600" />
                    <span>Auto-saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={11} className="text-emerald-600" />
                    <span>Auto-saved</span>
                  </>
                )}
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          {!embedded && onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#efefef] rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Text Editor Toolbar */}
      <div className="w-full bg-[#fcfbfa] border-b border-[#efefef] py-2 px-4 flex justify-center shrink-0 z-20">
        <Toolbar
          className="relative w-auto flex items-center justify-center"
          textAlign={textAlign}
          activeButtons={activeButtons}
          onTextAlignChange={setTextAlign}
          onAction={handleToolbarAction}
        />
      </div>

      {/* Multi-Page Canvas Area: Renders real individual A4 page sheets */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col items-center bg-[#f1f3f5] custom-scrollbar gap-8">
        {pages.map((_initialHtml, idx) => (
          <div 
            key={idx}
            onClick={() => setActivePageIndex(idx)}
            className={`w-full max-w-[794px] h-[1123px] max-h-[1123px] min-h-[1123px] bg-white shadow-md border ${
              activePageIndex === idx ? 'border-blue-400 ring-2 ring-blue-500/15' : 'border-[#e2e8f0]'
            } p-6 sm:px-12 sm:pt-8 sm:pb-6 relative rounded-xs flex flex-col justify-between overflow-hidden transition-all`}
          >
            {/* Top Sheet Header */}
            <div className="shrink-0 flex items-center justify-between text-[11px] text-slate-400 font-medium pb-3 mb-3 border-b border-slate-100 select-none">
              <div className="flex items-center gap-1.5 text-slate-500">
                <FileText size={13} className="text-[#0068f9]" />
                <span>Page {idx + 1} of {pages.length} (A4 • 210 × 297 mm)</span>
              </div>
              <div className="flex items-center gap-2">
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePage(idx);
                    }}
                    title={`Delete Page ${idx + 1}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Delete Page {idx + 1}</span>
                  </button>
                )}
                <span className="bg-[#eef5ff] text-[#0068f9] font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                  Page {idx + 1}
                </span>
              </div>
            </div>

            {/* Editable Canvas for this individual page */}
            <div
              ref={(el) => {
                pageRefs.current[idx] = el;
                if (el && (!el.innerHTML || el.innerHTML === '<p><br></p>')) {
                  const content = pagesContentRef.current[idx] || lastValidHtmlRef.current[idx] || pages[idx];
                  if (content) {
                    el.innerHTML = content;
                    lastValidHtmlRef.current[idx] = content;
                    pagesContentRef.current[idx] = content;
                  }
                }
              }}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setActivePageIndex(idx)}
              onClick={(e) => handleEditorClick(e, idx)}
              onInput={() => handlePageInput(idx)}
              onPaste={(e) => handlePaste(e, idx)}
              onKeyUp={updateToolbarSelection}
              onMouseUp={updateToolbarSelection}
              onSelect={updateToolbarSelection}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="w-full flex-1 overflow-hidden bg-transparent focus:outline-none font-sans text-[#121722] text-sm leading-relaxed rich-editor-content"
              spellCheck="false"
            />

            {/* Bottom Sheet Footer */}
            <div className="shrink-0 mt-auto pt-3 border-t border-slate-200 flex justify-end items-center text-[10px] text-slate-400 pointer-events-none select-none">
              <span>Page {idx + 1} of {pages.length}</span>
            </div>
          </div>
        ))}

        {/* Bottom Append Page Action */}
        <button
          type="button"
          onClick={() => handleAddPage(pages.length - 1)}
          className="my-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#121722] hover:text-[#0068f9] hover:bg-black/5 rounded-md transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Add new page</span>
        </button>
      </div>

    </div>
  );

  if (embedded) {
    return studioBody;
  }

  return (
    <div className="fixed inset-0 bg-[#121722]/50 backdrop-blur-xs z-[300] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-in fade-in duration-200">
      {studioBody}
    </div>
  );
}
