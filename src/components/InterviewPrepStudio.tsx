import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Copy, 
  Printer, 
  Trash2, 
  CopyCheck, 
  Search, 
  Tag, 
  X, 
  FileText,
  Check, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import Toolbar from './ui/toolbar';
import { 
  executeRichTextCommand, 
  queryEditorState, 
  normalizeUrl,
  markdownOrTextToHtml,
  paginateHtml
} from '../lib/editor-utils';
import { PersonalStory } from '../types';
import { triggerDirectPdfExport } from '../lib/pdf-export';
import { auth } from '../lib/firebase';

export interface InterviewPrepStudioProps {
  initialText?: string;
  companyName?: string;
  targetRole?: string;
  onClose?: () => void;
  onSave?: (text: string) => void;
  storageKey?: string;
  embedded?: boolean;
  isDemo?: boolean;
  trackingSystem?: 'industry' | 'academic';
}

const stripLeadingDuplicateTitle = (content: string): string => {
  if (!content) return content;
  return content.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
};

const cleanCompanyName = (company?: string): string => {
  if (!company) return '';
  const trimmed = company.trim();
  if (trimmed.toLowerCase() === 'unknown company' || trimmed.toLowerCase() === 'unknown') {
    return '';
  }
  return trimmed;
};

const DEFAULT_PREP_DOCS: PersonalStory[] = [
  {
    id: 'prep-doc-target-company',
    title: 'Target Company - Interview Strategy',
    topic: '',
    category: 'Strategy',
    tags: ['Target Company', 'Interview Strategy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<h2>1. Executive Summary &amp; Alignment</h2>
<p>Lead with core engineering strengths, component architecture, and measurable business outcomes. Frame experience directly around reliability, scalable architecture, and cross-functional ownership.</p>

<h2>2. Pivoting Weaknesses &amp; Gaps</h2>
<p>Acknowledge technical trade-offs transparently, explaining how you evaluate risk, isolate failure domains, and implement iterative telemetry.</p>

<h2>3. Deep Dive Scenarios &amp; STAR Responses</h2>
<ul>
  <li><strong>Complex Technical Challenge:</strong> How you investigated latency, resolved bottlenecks, and restored stability under peak load.</li>
  <li><strong>Architectural Consensus:</strong> Balancing delivery speed against maintainability through objective benchmarks and collaborative trade-offs.</li>
  <li><strong>Team Leadership:</strong> Elevating code quality, unblocking teammates, and driving projects to delivery.</li>
</ul>

<h2>4. 30-Second Interviewer Soundbite</h2>
<blockquote><em>"I focus on delivering resilient systems and empowering high-trust teams, transforming complex technical ambiguity into measurable business outcomes."</em></blockquote>`,
    pages: []
  }
];

export function InterviewPrepStudio({
  initialText,
  companyName,
  targetRole,
  onClose,
  onSave,
  storageKey,
  embedded = false,
  isDemo = false,
  trackingSystem = 'industry'
}: InterviewPrepStudioProps) {
  const uid = isDemo ? 'demo' : (auth.currentUser?.uid || 'guest');
  const isWorkspace = embedded;

  // Dedicated storage keys: Workspace is isolated from evaluation-specific sessions
  const workspaceStorageKey = `seekr_interview_prep_workspace_docs_${uid}`;
  const legacyStorageKey = `seekr_interview_prep_docs_${uid}`;
  const legacyPersonalStoriesKey = `seekr_personal_stories_${uid}`;
  
  const cleanCompany = cleanCompanyName(companyName);
  const effectiveSingleDocKey = storageKey || (cleanCompany || targetRole ? `studio_interview_prep_${(cleanCompany || 'general').replace(/\s+/g, '_')}_${(targetRole || 'general').replace(/\s+/g, '_')}` : `studio_interview_prep_custom_${Date.now()}`);

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Lock body scroll when opened in modal popup mode
  useEffect(() => {
    if (!embedded) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [embedded]);

  // Helper to build AI Doc metadata
  const getAiDocMeta = useCallback((rawText: string) => {
    const aiDocTitle = cleanCompany
      ? `${cleanCompany} - Interview Strategy`
      : (targetRole ? `${targetRole} - Interview Strategy` : 'Tailored Interview Strategy');
    const aiDocId = effectiveSingleDocKey;
    const convertedHtml = stripLeadingDuplicateTitle(markdownOrTextToHtml(rawText));
    return { aiDocTitle, aiDocId, convertedHtml };
  }, [cleanCompany, targetRole, effectiveSingleDocKey]);

  // Initialize unified list of prep documents/stories
  const [documents, setDocuments] = useState<PersonalStory[]>(() => {
    if (isWorkspace) {
      // WORKSPACE MODE (Main Workspace Studio):
      let list: PersonalStory[] = [];
      try {
        const saved = localStorage.getItem(workspaceStorageKey) || localStorage.getItem(legacyStorageKey) || localStorage.getItem(legacyPersonalStoriesKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed.map((s: any) => ({
              ...s,
              content: stripLeadingDuplicateTitle(s.content || ''),
              pages: Array.isArray(s.pages) && s.pages.length > 0
                ? [stripLeadingDuplicateTitle(s.pages[0]), ...s.pages.slice(1)]
                : [stripLeadingDuplicateTitle(s.content || '')],
              topic: '',
              tags: Array.isArray(s.tags)
                ? s.tags.filter((t: string) =>
                    t !== 'STAR Method' &&
                    t !== 'Mentorship' &&
                    t !== 'Interview Response' &&
                    t.toLowerCase() !== 'unknown company' &&
                    t.toLowerCase() !== 'unknown'
                  )
                : []
            }));

            // Filter out legacy placeholder seeds
            list = list.filter((d: any) => 
              d.id !== 'prep-doc-1' && 
              d.id !== 'prep-doc-2' && 
              d.id !== 'prep-doc-3' &&
              d.id !== 'story-default-1' && 
              d.id !== 'story-default-2' && 
              d.id !== 'story-default-3' &&
              !d.title?.startsWith('Resolving Database Deadlock') &&
              !d.title?.startsWith('Aligning Engineering & Product') &&
              !d.title?.startsWith('Mentoring an Early-Career Engineer')
            );

            // Never include evaluation-specific documents in the global workspace studio
            list = list.filter((d: any) => 
              !d.id?.startsWith('studio_interview_prep_') &&
              !d.id?.startsWith('ai-prep-') &&
              !d.title?.includes('Fullstack Developer') &&
              !(d.title?.endsWith(' - Interview Strategy') && d.title !== 'Target Company - Interview Strategy')
            );
          }
        }
      } catch (e) {
        console.warn('Failed to parse workspace interview prep documents:', e);
      }

      if (list.length === 0) {
        list = DEFAULT_PREP_DOCS;
      }

      try {
        localStorage.setItem(workspaceStorageKey, JSON.stringify(list));
        // Clean out legacy keys so evaluation titles do not linger
        localStorage.setItem(legacyStorageKey, JSON.stringify(list));
        localStorage.setItem(legacyPersonalStoriesKey, JSON.stringify(list));
      } catch {}

      return list;
    } else {
      // EVALUATION MODE (Opened from Match Analysis or Evaluation History):
      const aiDocTitle = cleanCompany
        ? `${cleanCompany} - Interview Strategy`
        : (targetRole ? `${targetRole} - Interview Strategy` : 'Tailored Interview Strategy');
      const aiDocId = effectiveSingleDocKey;

      let savedContent = '';
      let savedPages: string[] | null = null;
      try {
        const storedHtml = localStorage.getItem(effectiveSingleDocKey);
        if (storedHtml && storedHtml.trim()) {
          savedContent = storedHtml;
        }
        const storedPages = localStorage.getItem(`${effectiveSingleDocKey}_pages`);
        if (storedPages) {
          const parsed = JSON.parse(storedPages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedPages = parsed;
          }
        }
      } catch (e) {}

      const contentToUse = savedContent || (initialText ? stripLeadingDuplicateTitle(markdownOrTextToHtml(initialText)) : DEFAULT_PREP_DOCS[0].content);
      const pagesToUse = savedPages || [contentToUse];

      let evalDocs: PersonalStory[] = [];
      try {
        const storedDocs = localStorage.getItem(`${effectiveSingleDocKey}_docs`);
        if (storedDocs) {
          const parsed = JSON.parse(storedDocs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            evalDocs = parsed;
          }
        }
      } catch (e) {}

      if (evalDocs.length === 0) {
        evalDocs = [
          {
            id: aiDocId,
            title: aiDocTitle,
            topic: '',
            category: 'Strategy',
            tags: [cleanCompany, targetRole || 'Interview Strategy'].filter(Boolean) as string[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: contentToUse,
            pages: pagesToUse,
            targetCompany: cleanCompany,
            targetRole: targetRole
          }
        ];
      } else {
        evalDocs[0] = {
          ...evalDocs[0],
          title: aiDocTitle,
          content: contentToUse,
          pages: pagesToUse,
          updatedAt: new Date().toISOString()
        };
      }

      return evalDocs;
    }
  });

  const [activeStoryId, setActiveStoryId] = useState<string>(() => {
    return documents[0]?.id || (isWorkspace ? DEFAULT_PREP_DOCS[0].id : effectiveSingleDocKey);
  });

  // Ensure initialText is synced for evaluation studio if it loads or changes after mount
  useEffect(() => {
    if (isWorkspace || !initialText || !initialText.trim()) return;
    const { aiDocTitle, aiDocId, convertedHtml } = getAiDocMeta(initialText);

    let hasCustomSaved = false;
    try {
      hasCustomSaved = !!localStorage.getItem(effectiveSingleDocKey);
    } catch {}

    if (hasCustomSaved) return;

    setDocuments(prev => {
      const updated = prev.map((doc, idx) => {
        if (idx === 0 || doc.id === aiDocId) {
          return {
            ...doc,
            title: aiDocTitle,
            content: convertedHtml,
            pages: [convertedHtml],
            updatedAt: new Date().toISOString()
          };
        }
        return doc;
      });
      return updated;
    });

    isInitializedForStoryRef.current = null;
    setActiveStoryId(aiDocId);
  }, [initialText, isWorkspace, getAiDocMeta, effectiveSingleDocKey]);

  const activeStory = useMemo(() => {
    return documents.find(s => s.id === activeStoryId) || documents[0] || DEFAULT_PREP_DOCS[0];
  }, [documents, activeStoryId]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Editor states
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [activeButtons, setActiveButtons] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // DOM refs
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastValidHtmlRef = useRef<string[]>([]);
  const pagesContentRef = useRef<string[]>([]);
  const statsDebounceRef = useRef<any>(null);
  const autoSaveDebounceRef = useRef<any>(null);
  const isInitializedForStoryRef = useRef<string | null>(null);

  // Synchronize all documents to localStorage (isolated per workspace vs evaluation)
  const persistDocuments = useCallback((updatedList: PersonalStory[]) => {
    if (isDemo) return;
    try {
      if (isWorkspace) {
        localStorage.setItem(workspaceStorageKey, JSON.stringify(updatedList));
      } else {
        localStorage.setItem(`${effectiveSingleDocKey}_docs`, JSON.stringify(updatedList));
      }
    } catch (e) {
      console.warn('Failed to save documents to localStorage:', e);
    }
  }, [isWorkspace, workspaceStorageKey, effectiveSingleDocKey, isDemo]);

  // Snapshot current DOM innerHTML or ref memory of all pages
  const snapshotDomPages = useCallback((): string[] => {
    const count = pages.length;
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
    pageRefs.current.length = count;
    pagesContentRef.current.length = count;
    lastValidHtmlRef.current.length = count;
    return result;
  }, [pages]);

  // Auto-save active document content & pages
  const triggerAutoSave = useCallback(() => {
    if (isDemo) return;
    setSaveStatus('saving');

    const currentPages = snapshotDomPages();
    const combinedHtml = currentPages.join('');

    // If in evaluation mode, persist specifically to this evaluation's single doc keys
    if (!isWorkspace && effectiveSingleDocKey) {
      try {
        localStorage.setItem(effectiveSingleDocKey, combinedHtml);
        localStorage.setItem(`${effectiveSingleDocKey}_pages`, JSON.stringify(currentPages));
      } catch (e) {}
    }

    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(() => {
      setDocuments(prev => {
        const nextList = prev.map(s => {
          if (s.id === activeStoryId) {
            return {
              ...s,
              content: combinedHtml,
              pages: currentPages,
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });
        persistDocuments(nextList);
        return nextList;
      });

      if (onSaveRef.current) {
        onSaveRef.current(combinedHtml);
      }
      setSaveStatus('saved');
    }, 400);
  }, [activeStoryId, snapshotDomPages, persistDocuments, effectiveSingleDocKey, isDemo]);

  // Debounced word count calculator across all page sheets
  const debouncedUpdateWordCount = useCallback(() => {
    if (statsDebounceRef.current) clearTimeout(statsDebounceRef.current);
    statsDebounceRef.current = setTimeout(() => {
      const texts = pageRefs.current
        .map(el => (el ? el.innerText.trim() : ''))
        .filter(Boolean);
      const totalWords = texts.reduce((acc, t) => {
        const words = t.split(/\s+/).filter(Boolean);
        return acc + words.length;
      }, 0);
      setWordCount(totalWords);
    }, 150);
  }, []);

  // Undo & Redo History Management
  const historyRef = useRef<{ pages: string[]; activePageIndex: number }[]>([]);
  const redoRef = useRef<{ pages: string[]; activePageIndex: number }[]>([]);
  const isUndoRedoActionRef = useRef(false);

  const recordHistorySnapshot = useCallback(() => {
    if (isUndoRedoActionRef.current) return;
    const currentDomPages = snapshotDomPages();
    const lastSnap = historyRef.current[historyRef.current.length - 1];
    
    if (lastSnap && JSON.stringify(lastSnap.pages) === JSON.stringify(currentDomPages)) {
      return;
    }

    historyRef.current.push({
      pages: [...currentDomPages],
      activePageIndex
    });
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    redoRef.current = [];
  }, [snapshotDomPages, activePageIndex]);

  // Debounced history snapshot for continuous typing
  const debouncedRecordHistoryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRecordHistory = useCallback(() => {
    if (debouncedRecordHistoryRef.current) {
      clearTimeout(debouncedRecordHistoryRef.current);
    }
    debouncedRecordHistoryRef.current = setTimeout(() => {
      recordHistorySnapshot();
    }, 450);
  }, [recordHistorySnapshot]);

  const handleUndo = useCallback(() => {
    if (isDemo) {
      toast.info('Demo Mode: Modifying content is restricted in this view-only portfolio preview.');
      return;
    }
    const currentDomPages = snapshotDomPages();
    const lastSnap = historyRef.current[historyRef.current.length - 1];
    if (!lastSnap || JSON.stringify(lastSnap.pages) !== JSON.stringify(currentDomPages)) {
      historyRef.current.push({
        pages: [...currentDomPages],
        activePageIndex
      });
    }

    if (historyRef.current.length <= 1) {
      toast.info('Nothing to undo');
      return;
    }

    isUndoRedoActionRef.current = true;
    const current = historyRef.current.pop()!;
    redoRef.current.push(current);

    const targetState = historyRef.current[historyRef.current.length - 1];
    if (targetState) {
      pageRefs.current.length = targetState.pages.length;
      pagesContentRef.current = [...targetState.pages];
      lastValidHtmlRef.current = [...targetState.pages];
      setPages([...targetState.pages]);
      const targetIdx = Math.min(targetState.activePageIndex, targetState.pages.length - 1);
      setActivePageIndex(targetIdx);

      setTimeout(() => {
        targetState.pages.forEach((html, i) => {
          const el = pageRefs.current[i];
          if (el) el.innerHTML = html;
        });
        const activeEl = pageRefs.current[targetIdx];
        if (activeEl) activeEl.focus();
        debouncedUpdateWordCount();
        triggerAutoSave();
        isUndoRedoActionRef.current = false;
      }, 30);
    } else {
      isUndoRedoActionRef.current = false;
    }
  }, [isDemo, snapshotDomPages, activePageIndex, debouncedUpdateWordCount, triggerAutoSave]);

  const handleRedo = useCallback(() => {
    if (isDemo) {
      toast.info('Demo Mode: Modifying content is restricted in this view-only portfolio preview.');
      return;
    }
    if (redoRef.current.length === 0) {
      toast.info('Nothing to redo');
      return;
    }

    isUndoRedoActionRef.current = true;
    const nextState = redoRef.current.pop()!;
    historyRef.current.push(nextState);

    pageRefs.current.length = nextState.pages.length;
    pagesContentRef.current = [...nextState.pages];
    lastValidHtmlRef.current = [...nextState.pages];
    setPages([...nextState.pages]);
    const targetIdx = Math.min(nextState.activePageIndex, nextState.pages.length - 1);
    setActivePageIndex(targetIdx);

    setTimeout(() => {
      nextState.pages.forEach((html, i) => {
        const el = pageRefs.current[i];
        if (el) el.innerHTML = html;
      });
      const activeEl = pageRefs.current[targetIdx];
      if (activeEl) activeEl.focus();
      debouncedUpdateWordCount();
      triggerAutoSave();
      isUndoRedoActionRef.current = false;
    }, 30);
  }, [isDemo, debouncedUpdateWordCount, triggerAutoSave]);

  // Initialize or switch active document
  useEffect(() => {
    if (!activeStory) return;
    if (isInitializedForStoryRef.current === activeStory.id) {
      return;
    }
    isInitializedForStoryRef.current = activeStory.id;

    let storyPages = activeStory.pages && activeStory.pages.length > 0 
      ? activeStory.pages 
      : [activeStory.content || '<p><br></p>'];

    storyPages = [stripLeadingDuplicateTitle(storyPages[0]), ...storyPages.slice(1)];

    setPages(storyPages);
    pagesContentRef.current = [...storyPages];
    lastValidHtmlRef.current = [...storyPages];
    setActivePageIndex(0);

    // Initialize history stack with pristine initial document state
    historyRef.current = [{
      pages: [...storyPages],
      activePageIndex: 0
    }];
    redoRef.current = [];

    setTimeout(() => {
      storyPages.forEach((html, i) => {
        const el = pageRefs.current[i];
        if (el) {
          el.innerHTML = html;
          lastValidHtmlRef.current[i] = html;
          pagesContentRef.current[i] = html;
        }
      });
      debouncedUpdateWordCount();
    }, 40);
  }, [activeStory?.id]);

  // Update toolbar active buttons from caret position
  const updateToolbarSelection = useCallback(() => {
    const activeEditor = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (!activeEditor) return;
    const state = queryEditorState(activeEditor);
    setActiveButtons(state.activeButtons);
    if (state.textAlign) {
      setTextAlign(state.textAlign);
    }
  }, [activePageIndex]);

  // Smart auto-pagination when content exceeds 1 page
  const autoPaginatePageIfOverflow = useCallback((pageIndex: number) => {
    const el = pageRefs.current[pageIndex];
    if (!el) return;

    // Split overflowing content intelligently across pages
    const fullHtml = el.innerHTML;
    const paginated = paginateHtml(el, fullHtml);

    if (paginated.length <= 1) {
      lastValidHtmlRef.current[pageIndex] = el.innerHTML;
      pagesContentRef.current[pageIndex] = el.innerHTML;
      debouncedUpdateWordCount();
      triggerAutoSave();
      return;
    }

    const currentDomPages = snapshotDomPages();
    const nextPages = [
      ...currentDomPages.slice(0, pageIndex),
      ...paginated,
      ...currentDomPages.slice(pageIndex + 1)
    ];

    setPages(nextPages);
    pagesContentRef.current = [...nextPages];
    lastValidHtmlRef.current = [...nextPages];

    setTimeout(() => {
      nextPages.forEach((html, i) => {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          pageEl.innerHTML = html;
        }
      });
      debouncedUpdateWordCount();
      triggerAutoSave();
    }, 40);
  }, [snapshotDomPages, debouncedUpdateWordCount, triggerAutoSave]);

  // Handle paste in a page sheet: auto-extend pages to hold all content
  const handlePaste = (_e: React.ClipboardEvent<HTMLDivElement>, pageIndex: number) => {
    if (isDemo) {
      _e.preventDefault();
      toast.info('Demo Mode: Modifying content is restricted in this view-only portfolio preview.');
      return;
    }
    // Allow the native paste into contenteditable, then run smart auto-pagination
    setTimeout(() => {
      autoPaginatePageIfOverflow(pageIndex);
    }, 20);
  };

  // Handle live typing in a page sheet
  const handlePageInput = (idx: number) => {
    setActivePageIndex(idx);
    const el = pageRefs.current[idx];
    if (!el) return;

    if (el.scrollHeight > 980) {
      autoPaginatePageIfOverflow(idx);
    } else {
      lastValidHtmlRef.current[idx] = el.innerHTML;
      pagesContentRef.current[idx] = el.innerHTML;
      debouncedUpdateWordCount();
      triggerAutoSave();
      debouncedRecordHistory();
    }
  };

  // Handle keyboard shortcuts & smart page breaks
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageIndex: number) => {
    e.stopPropagation();

    if (isDemo) {
      const isNav = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key) ||
        ((e.ctrlKey || e.metaKey) && ['c', 'a'].includes(e.key.toLowerCase()));
      if (!isNav) {
        e.preventDefault();
        toast.info('Demo Mode: Modifying content is restricted in this view-only portfolio preview.', { id: 'demo-edit' });
      }
      return;
    }

    // Undo: Ctrl+Z / Cmd+Z | Redo: Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }

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
  };

  const handleToolbarAction = (action: string, value?: string) => {
    if (isDemo) {
      toast.info('Demo Mode: Modifying content is restricted in this view-only portfolio preview.');
      return;
    }

    if (action === 'undo') {
      handleUndo();
      return;
    }
    if (action === 'redo') {
      handleRedo();
      return;
    }

    recordHistorySnapshot();

    const activeEditor = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (!activeEditor) return;

    const state = executeRichTextCommand(activeEditor, action, value);
    setActiveButtons(state.activeButtons);
    if (state.textAlign) {
      setTextAlign(state.textAlign);
    }

    const currentHtml = activeEditor.innerHTML;
    pagesContentRef.current[activePageIndex] = currentHtml;
    lastValidHtmlRef.current[activePageIndex] = currentHtml;

    debouncedUpdateWordCount();
    triggerAutoSave();
  };

  // Add new A4 sheet
  const handleAddPage = (afterIndex?: number) => {
    if (isDemo) {
      toast.info('Demo Mode: Adding new pages is prohibited in this view-only portfolio showcase.');
      return;
    }
    recordHistorySnapshot();
    const currentDomPages = snapshotDomPages();
    const insertAt = typeof afterIndex === 'number' ? afterIndex + 1 : currentDomPages.length;
    const nextPages = [...currentDomPages];
    nextPages.splice(insertAt, 0, '<p><br></p>');

    setPages(nextPages);
    pagesContentRef.current = [...nextPages];
    lastValidHtmlRef.current = [...nextPages];
    setActivePageIndex(insertAt);

    setTimeout(() => {
      nextPages.forEach((html, i) => {
        const el = pageRefs.current[i];
        if (el) {
          el.innerHTML = html;
        }
      });
      const newEl = pageRefs.current[insertAt];
      if (newEl) {
        newEl.focus();
      }
      debouncedUpdateWordCount();
      triggerAutoSave();
    }, 50);
    toast.success(`Page ${insertAt + 1} added`);
  };

  // Remove sheet
  const handleRemovePage = (indexToRemove: number) => {
    if (isDemo) {
      toast.info('Demo Mode: Removing pages is prohibited in this view-only portfolio showcase.');
      return;
    }
    if (pages.length <= 1) {
      toast.warning('A document must have at least one page.');
      return;
    }
    recordHistorySnapshot();
    const currentDomPages = snapshotDomPages();
    const nextPages = currentDomPages.filter((_, i) => i !== indexToRemove);

    // Truncate refs explicitly so deleted elements cannot be resurrected
    pageRefs.current.length = nextPages.length;
    pagesContentRef.current = [...nextPages];
    lastValidHtmlRef.current = [...nextPages];
    setPages(nextPages);

    const nextActive = Math.max(0, Math.min(activePageIndex, nextPages.length - 1));
    setActivePageIndex(nextActive);

    const combinedHtml = nextPages.join('');
    if (!isWorkspace && effectiveSingleDocKey) {
      try {
        localStorage.setItem(effectiveSingleDocKey, combinedHtml);
        localStorage.setItem(`${effectiveSingleDocKey}_pages`, JSON.stringify(nextPages));
      } catch (e) {}
    }

    setDocuments(prev => {
      const nextList = prev.map(s => {
        if (s.id === activeStoryId) {
          return {
            ...s,
            content: combinedHtml,
            pages: nextPages,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      persistDocuments(nextList);
      return nextList;
    });

    if (onSaveRef.current) {
      onSaveRef.current(combinedHtml);
    }

    setTimeout(() => {
      nextPages.forEach((html, i) => {
        const el = pageRefs.current[i];
        if (el) {
          el.innerHTML = html;
        }
      });
      debouncedUpdateWordCount();
    }, 40);

    toast.info(`Page ${indexToRemove + 1} removed`);
  };

  // Update Head Title or Tags
  const handleUpdateDocTitle = (newTitle: string) => {
    if (isDemo) return;
    setDocuments(prev => {
      const nextList = prev.map(s => {
        if (s.id === activeStoryId) {
          return {
            ...s,
            title: newTitle,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      persistDocuments(nextList);
      return nextList;
    });
  };

  // Add / remove tags
  const handleAddTag = (rawTag: string) => {
    if (isDemo) return;
    const tag = rawTag.trim();
    if (!tag) return;
    if (activeStory.tags.includes(tag)) return;

    setDocuments(prev => {
      const nextList = prev.map(s => {
        if (s.id === activeStoryId) {
          return {
            ...s,
            tags: [...s.tags, tag],
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      persistDocuments(nextList);
      return nextList;
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isDemo) return;
    setDocuments(prev => {
      const nextList = prev.map(s => {
        if (s.id === activeStoryId) {
          return {
            ...s,
            tags: s.tags.filter(t => t !== tagToRemove),
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      persistDocuments(nextList);
      return nextList;
    });
  };

  const handleManualSave = () => {
    if (isDemo) {
      toast.info('Demo Mode: Saving is prohibited in this view-only portfolio showcase.');
      return;
    }
    persistDocuments(documents);
    toast.success('Document saved successfully');
  };

  // Copy active document content to clipboard
  const handleCopy = () => {
    const texts = pageRefs.current
      .map(el => (el ? el.innerText.trim() : ''))
      .filter(Boolean);
    const combined = [
      `TITLE: ${activeStory.title}`,
      activeStory.tags.length > 0 ? `TAGS: ${activeStory.tags.join(', ')}` : null,
      '----------------------------------------',
      texts.join('\n\n')
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(combined);
    setCopied(true);
    toast.success('Document copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Export individual document as pristine printable PDF (Direct print preview without opening a new browser tab)
  const handleExportPDF = () => {
    if (isDemo) {
      toast.info('Demo Mode: Exporting PDF is prohibited in this view-only portfolio showcase.');
      return;
    }

    const sanitizePrintHtml = (rawHtml: string): string => {
      if (!rawHtml) return '';
      return rawHtml
        .replace(/<h[1-6][^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/h[1-6]>/gi, '')
        .replace(/<blockquote[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/blockquote>/gi, '')
        .replace(/<li[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/li>/gi, '')
        .replace(/<ul[^>]*>\s*<\/ul>/gi, '')
        .replace(/<ol[^>]*>\s*<\/ol>/gi, '')
        .replace(/(?:<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>\s*){2,}/gi, '<p><br></p>')
        .replace(/^(?:\s*<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+/gi, '')
        .trim();
    };

    const currentDomPages = snapshotDomPages();
    const pagesHtml = currentDomPages.map((content, i) => {
      const sanitized = sanitizePrintHtml(content);
      return `
      <div class="a4-page-sheet">
        ${i === 0 ? `
          <div class="story-header-print">
            ${activeStory.tags && activeStory.tags.length > 0 ? `
              <div class="badge-row">
                <span class="tags-badge">${activeStory.tags.join(' • ')}</span>
              </div>
            ` : ''}
            <h1 class="story-title-print">${activeStory.title}</h1>
          </div>
        ` : ''}
        <div class="content">${sanitized}</div>
        <div class="page-footer-print">
          <span>Powered by Seekr <a href="https://seekr-v5am.onrender.com/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">https://seekr-v5am.onrender.com/</a></span>
          <span>Page ${i + 1} of ${currentDomPages.length}</span>
        </div>
      </div>
    `;
    }).join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeStory.title || 'Interview Strategy'} - Seekr</title>
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
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .a4-page-sheet {
              width: 210mm;
              height: 296mm;
              max-height: 296mm;
              padding: 22mm 22mm 18mm 22mm;
              box-sizing: border-box;
              position: relative;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }
            .a4-page-sheet:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .story-header-print {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .badge-row {
              display: flex;
              gap: 8px;
              margin-bottom: 8px;
            }
            .tags-badge {
              font-size: 8.5pt;
              color: #64748b;
              padding: 2px 4px;
            }
            .story-title-print {
              font-size: 18pt;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 8px 0;
              line-height: 1.25;
            }
            .content {
              flex: 1;
              font-size: 10.5pt;
              line-height: 1.65;
              color: #334155;
            }
            .content h1:empty,
            .content h2:empty,
            .content h3:empty,
            .content p:empty,
            .content blockquote:empty,
            .content ul:empty,
            .content ol:empty,
            .content li:empty {
              display: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              height: 0 !important;
            }
            .content h2 {
              font-size: 13.5pt;
              font-weight: 700;
              color: #0f172a;
              margin-top: 14pt;
              margin-bottom: 5pt;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 2pt;
            }
            .content p {
              margin-top: 0;
              margin-bottom: 9pt;
            }
            .content ul {
              margin-top: 0;
              margin-bottom: 9pt;
              padding-left: 18pt;
            }
            .content li {
              margin-bottom: 3pt;
            }
            .content blockquote {
              border-left: 3.5px solid #0068f9;
              padding-left: 12pt;
              margin: 10pt 0;
              font-style: italic;
              color: #1e293b;
              background-color: #f8fafc;
              padding-top: 5pt;
              padding-bottom: 5pt;
              border-radius: 0 4px 4px 0;
            }
            .page-footer-print {
              font-size: 8.5pt;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 8pt;
              display: flex;
              justify-content: space-between;
              margin-top: 10pt;
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
            window.onload = function() {
              window.focus();
              window.print();
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    triggerDirectPdfExport(fullHtml);
  };

  // Create new document
  const handleCreateNewDoc = () => {
    if (isDemo) {
      toast.info('Demo Mode: Creating new documents is restricted in view-only preview.');
      return;
    }
    const newId = `prep-doc-${Date.now()}`;
    const initialContent = `<h2>1. Situation &amp; Context</h2>
<p>Describe the specific background, the business or technical stakes, and any resource or timeline constraints.</p>

<h2>2. Task &amp; Objective</h2>
<p>State your explicit personal responsibility and measurable goals.</p>

<h2>3. Action Taken</h2>
<ul>
  <li><strong>First Action / Technical Step:</strong> How you analyzed the challenge and formulated options.</li>
  <li><strong>Execution &amp; Trade-Offs:</strong> Key decisions, tools applied, and cross-functional coordination.</li>
  <li><strong>Course-Correction:</strong> How you overcame an obstacle encountered during execution.</li>
</ul>

<h2>4. Result &amp; Measurable Impact</h2>
<p>Quantify the outcome (e.g. latency reduced by 30%, $100k saved, or shipped 2 weeks ahead of schedule).</p>

<h2>5. 30-Second Interviewer Soundbite</h2>
<blockquote><em>"The primary takeaway from this experience is..."</em></blockquote>`;

    const newDoc: PersonalStory = {
      id: newId,
      title: 'Untitled Interview Strategy / Story',
      topic: '',
      category: 'General',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: initialContent,
      pages: [initialContent]
    };

    setDocuments(prev => {
      const nextList = [newDoc, ...prev];
      persistDocuments(nextList);
      return nextList;
    });

    isInitializedForStoryRef.current = null;
    setActiveStoryId(newId);
    toast.success('New interview strategy created');
  };

  // Duplicate document
  const handleDuplicateDoc = (docToDup: PersonalStory) => {
    if (isDemo) {
      toast.info('Demo Mode: Duplicating documents is restricted.');
      return;
    }
    const newId = `prep-doc-${Date.now()}`;
    const dupDoc: PersonalStory = {
      ...docToDup,
      id: newId,
      title: `${docToDup.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDocuments(prev => {
      const nextList = [dupDoc, ...prev];
      persistDocuments(nextList);
      return nextList;
    });

    isInitializedForStoryRef.current = null;
    setActiveStoryId(newId);
    toast.success('Document duplicated');
  };

  // Delete document
  const handleDeleteDoc = (idToDelete: string) => {
    if (isDemo) {
      toast.info('Demo Mode: Deleting documents is restricted.');
      return;
    }
    if (documents.length <= 1) {
      toast.warning('You must keep at least one document in your studio.');
      return;
    }

    setDocuments(prev => {
      const nextList = prev.filter(s => s.id !== idToDelete);
      persistDocuments(nextList);
      return nextList;
    });

    if (activeStoryId === idToDelete) {
      const remaining = documents.filter(s => s.id !== idToDelete);
      if (remaining.length > 0) {
        isInitializedForStoryRef.current = null;
        setActiveStoryId(remaining[0].id);
      }
    }
    toast.info('Document deleted');
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = (s.title || '').toLowerCase().includes(q);
      const inTags = (s.tags || []).some(t => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  }, [documents, searchQuery]);

  const studioBody = (
    <div className={`bg-[#faf9f7] rounded-2xl w-full flex flex-col overflow-hidden border border-[#efefef] ${
      embedded 
        ? 'h-full min-h-[calc(100vh-140px)] shadow-2xs' 
        : 'max-w-6xl h-[92vh] shadow-2xl'
    }`}>
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-[#efefef] shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center font-bold shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#121722] truncate">Interview Prep Studio</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f1ff] text-[#0068f9] border border-[#0068f9]/20 shrink-0">
                {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
              </span>
            </div>
            <p className="text-xs text-[#777c86] flex items-center gap-1.5 flex-wrap">
              <span className="truncate max-w-[200px] sm:max-w-none">
                {isWorkspace 
                  ? 'Your tailored stories & interview strategies' 
                  : (cleanCompany ? `Tailored for ${cleanCompany}` : (targetRole ? `Tailored for ${targetRole}` : 'Your tailored stories & interview strategies'))}
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                {pages.length === 1 ? '1 A4 Page' : `${pages.length} A4 Pages`}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handleManualSave}
                title={isDemo ? "Saving is prohibited in Demo Mode" : "Auto-saves automatically. Click to save immediately."}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all select-none ${
                  isDemo
                    ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                    : saveStatus === 'saving' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100 cursor-pointer active:scale-95' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/70 cursor-pointer active:scale-95'
                }`}
              >
                {isDemo ? (
                  <>
                    <Check size={11} className="text-zinc-400" />
                    <span>View-only (Demo)</span>
                  </>
                ) : saveStatus === 'saving' ? (
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

        {/* Global Studio Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCreateNewDoc}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#121722] text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#efefef] hover:bg-[#faf9f7] text-[#121722] text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-full transition-all shadow-2xs ${
              isDemo
                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-zinc-100 cursor-not-allowed'
                : 'bg-[#0068f9] text-white hover:bg-[#024bb1] cursor-pointer'
            }`}
            title={isDemo ? "Exporting PDF is prohibited in Demo Mode" : "Export document as A4 PDF"}
          >
            <Printer size={15} className={isDemo ? "text-zinc-400" : "text-white"} />
            <span>Export PDF</span>
          </button>

          {!embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#efefef] rounded-full transition-colors cursor-pointer"
              title="Close Studio"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Body: Split View (Left Docs List, Right Interactive Editor Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Documents / Stories Aggregator */}
        <aside className="w-[280px] sm:w-[300px] bg-white border-r border-[#efefef] flex flex-col shrink-0 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-[#efefef] bg-[#fafafa]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search strategies, stories, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0068f9]"
              />
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
            {filteredDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <BookOpen size={24} className="text-slate-300" />
                <span>No matching documents found.</span>
              </div>
            ) : (
              filteredDocs.map(doc => {
                const isSelected = doc.id === activeStoryId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (doc.id !== activeStoryId) {
                        isInitializedForStoryRef.current = null;
                        setActiveStoryId(doc.id);
                      }
                    }}
                    className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-500/20 shadow-2xs'
                        : 'bg-white border-[#eef2f6] hover:bg-[#fafafa] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-bold text-[#121722] line-clamp-2 flex-1 group-hover:text-[#0068f9] transition-colors leading-snug">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateDoc(doc);
                          }}
                          title="Duplicate document"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <CopyCheck size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDoc(doc.id);
                          }}
                          title="Delete document"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                      <span>Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Editor Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f1f3f5]">
          {/* Document Head Editor (Title and Competency / Method Tags) */}
          <div className="bg-white border-b border-[#efefef] p-4 sm:px-8 py-3.5 flex flex-col gap-3 shadow-2xs shrink-0">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                value={activeStory.title}
                onChange={(e) => handleUpdateDocTitle(e.target.value)}
                placeholder="Document Title (e.g. Scaling Ingestion Under Sudden 10x Load Spike)"
                className="text-base sm:text-lg font-bold text-[#0f172a] bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#0068f9] focus:outline-none w-full transition-colors"
              />
            </div>

            {/* Competency & Method Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Tag size={12} />
                <span>Tags:</span>
              </span>
              {activeStory.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="text-[11px] px-2 py-0.5 rounded border border-dashed border-slate-300 bg-transparent text-slate-600 focus:outline-none focus:border-[#0068f9] w-48"
              />
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

          {/* Multi-Page Canvas Area: True A4 page sheets */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col items-center bg-[#f1f3f5] custom-scrollbar gap-4 sm:gap-5">
            {pages.map((_initialHtml, idx) => (
              <div
                key={idx}
                onClick={() => setActivePageIndex(idx)}
                className={`w-full max-w-[794px] h-[1123px] max-h-[1123px] min-h-[1123px] bg-white shadow-md border ${
                  activePageIndex === idx ? 'border-blue-400 ring-2 ring-blue-500/15' : 'border-[#e2e8f0]'
                } p-6 sm:px-12 sm:pt-6 sm:pb-5 relative rounded-xs flex flex-col justify-between overflow-hidden transition-all`}
              >
                {/* Top Sheet Header */}
                <div className="shrink-0 flex items-center justify-between text-[11px] text-slate-400 font-medium pb-2 mb-2 border-b border-slate-100 select-none">
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 size={11} />
                        <span>Delete Page</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPage(idx);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-[#0068f9] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>Add New Page</span>
                    </button>
                  </div>
                </div>

                {/* Editable Sheet Content Area */}
                <div
                  ref={(el) => { pageRefs.current[idx] = el; }}
                  contentEditable={!isDemo}
                  suppressContentEditableWarning
                  onFocus={() => setActivePageIndex(idx)}
                  onInput={() => handlePageInput(idx)}
                  onPaste={(e) => handlePaste(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onKeyUp={updateToolbarSelection}
                  onMouseUp={updateToolbarSelection}
                  onSelect={updateToolbarSelection}
                  className="flex-1 w-full text-slate-800 font-sans focus:outline-none select-text text-sm sm:text-base leading-relaxed rich-editor-content"
                  style={{
                    textAlign: textAlign,
                    minHeight: '940px',
                    maxHeight: '975px'
                  }}
                />

                {/* Bottom Sheet Footer */}
                <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 select-none">
                  <div className="flex items-center gap-1.5 truncate max-w-[480px]">
                    <span className="font-medium text-slate-500">Powered by Seekr</span>
                    <a
                      href="https://seekr-v5am.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-[#0068f9] underline underline-offset-2 transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      https://seekr-v5am.onrender.com/
                    </a>
                  </div>
                  <span className="font-medium text-slate-500 shrink-0">
                    Page {idx + 1} of {pages.length}
                  </span>
                </div>
              </div>
            ))}

            {/* Bottom Append Page Action */}
            <button
              type="button"
              onClick={() => handleAddPage(pages.length - 1)}
              className={`my-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all ${
                isDemo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
              title={isDemo ? "Adding pages is prohibited in Demo Mode" : "Add new page"}
            >
              <Plus size={14} className="text-[#0068f9]" />
              <span>Add New Page</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );

  if (embedded) {
    return studioBody;
  }

  return (
    <div 
      className="fixed inset-0 bg-[#121722]/50 backdrop-blur-xs z-[300] flex items-center justify-center p-2 sm:p-4 lg:p-6 transition-all duration-300 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {studioBody}
    </div>
  );
}

export default InterviewPrepStudio;
