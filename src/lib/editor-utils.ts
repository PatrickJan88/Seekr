/**
 * Rich text utility functions for formatting and parsing document content
 */

export function markdownOrTextToHtml(raw: string): string {
  if (!raw || !raw.trim()) {
    return '<p><br></p>';
  }

  // If already rich HTML with paragraph or header tags, return as is
  if (/<(p|div|h[1-6]|ul|ol|li|blockquote)[\s>]/i.test(raw)) {
    return raw;
  }

  // Split into distinct paragraph blocks separated by one or more blank lines
  const blocks = raw.split(/\n\s*\n/);
  const htmlParts: string[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split('\n');
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('### ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h3>${formatInlineStyles(line.substring(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h2>${formatInlineStyles(line.substring(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h1>${formatInlineStyles(line.substring(2))}</h1>`);
      } else if (line.startsWith('> ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<blockquote>${formatInlineStyles(line.substring(2))}</blockquote>`);
      } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        if (!inList) {
          htmlParts.push('<ul>');
          inList = true;
        }
        const itemContent = line.startsWith('• ') ? line.substring(2) : line.substring(2);
        htmlParts.push(`<li>${formatInlineStyles(itemContent)}</li>`);
      } else {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<p>${formatInlineStyles(line)}</p>`);
      }
    }

    if (inList) {
      htmlParts.push('</ul>');
    }
  }

  return htmlParts.length > 0 ? htmlParts.join('') : '<p><br></p>';
}

/**
 * Automatically paginates HTML content across multiple pages if it exceeds the height of containerEl
 */
export function paginateHtml(
  containerEl: HTMLElement,
  fullHtml: string
): string[] {
  if (!fullHtml || !fullHtml.trim() || fullHtml === '<p><br></p>') {
    return ['<p><br></p>'];
  }

  const originalHtml = containerEl.innerHTML;

  // Temporarily mount fullHtml to check if it overflows
  containerEl.innerHTML = fullHtml;
  const clientHeight = containerEl.clientHeight > 200 ? containerEl.clientHeight : 920;

  // If it fits comfortably within 1 page, keep it as single page
  if (containerEl.scrollHeight <= clientHeight + 4) {
    containerEl.innerHTML = originalHtml;
    return [fullHtml];
  }

  // Content exceeds 1 page! Extract top-level child nodes
  const sourceNodes = Array.from(containerEl.childNodes);
  const pagesHtml: string[] = [];

  containerEl.innerHTML = '';
  let currentPageContainer = document.createElement('div');
  containerEl.appendChild(currentPageContainer);

  const startNewPage = () => {
    if (currentPageContainer.innerHTML.trim()) {
      pagesHtml.push(currentPageContainer.innerHTML);
    }
    currentPageContainer.innerHTML = '';
  };

  for (const node of sourceNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      // If it's a list (UL or OL), paginate by <li> items
      if (tagName === 'UL' || tagName === 'OL') {
        const listTag = tagName.toLowerCase();
        let activeList = document.createElement(listTag);
        currentPageContainer.appendChild(activeList);

        const listItems = Array.from(el.children);
        for (const li of listItems) {
          activeList.appendChild(li.cloneNode(true));

          // Check if this item causes the page to exceed clientHeight
          if (containerEl.scrollHeight > clientHeight + 2) {
            // Remove the overflowing <li>
            activeList.removeChild(activeList.lastChild!);

            if (activeList.children.length === 0) {
              currentPageContainer.removeChild(activeList);
            }

            // Finish current page and start a new one
            startNewPage();

            // Create new list on the new page and add the li
            activeList = document.createElement(listTag);
            currentPageContainer.appendChild(activeList);
            activeList.appendChild(li.cloneNode(true));
          }
        }
        continue;
      }

      // Regular block element (P, H1-H6, BLOCKQUOTE, etc.)
      currentPageContainer.appendChild(el.cloneNode(true));

      if (containerEl.scrollHeight > clientHeight + 2) {
        currentPageContainer.removeChild(currentPageContainer.lastChild!);

        if (currentPageContainer.innerHTML.trim()) {
          startNewPage();
          currentPageContainer.appendChild(el.cloneNode(true));
        } else {
          currentPageContainer.appendChild(el.cloneNode(true));
          startNewPage();
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const p = document.createElement('p');
      p.textContent = node.textContent;
      currentPageContainer.appendChild(p);

      if (containerEl.scrollHeight > clientHeight + 2) {
        currentPageContainer.removeChild(currentPageContainer.lastChild!);
        startNewPage();
        currentPageContainer.appendChild(p);
      }
    }
  }

  // Final page
  if (currentPageContainer.innerHTML.trim()) {
    pagesHtml.push(currentPageContainer.innerHTML);
  }

  containerEl.innerHTML = originalHtml;

  return pagesHtml.length > 0 ? pagesHtml : [fullHtml];
}

function formatInlineStyles(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
    .replace(/==(.+?)==/g, '<mark style="background-color: #fef08a; padding: 0 3px; border-radius: 2px;">$1</mark>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0068f9; text-decoration: underline; font-weight: 500;">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0068f9; text-decoration: underline; font-weight: 500;">$2</a>');
}

export function isUrlLike(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;

  // Protocol prefixes
  if (/^https?:\/\/\S+/i.test(t)) return true;
  if (/^mailto:\S+@\S+\.\S+/i.test(t)) return true;
  if (/^www\.\S+\.\S+/i.test(t)) return true;

  // Email format
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return true;

  // Domain structure: e.g. pofeiportfolio.vercel.app or github.com/user
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/i;
  if (domainPattern.test(t)) return true;

  return false;
}

export function normalizeUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t)) {
    return t;
  }
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) {
    return `mailto:${t}`;
  }
  return `https://${t}`;
}

export function formatAnchors(container: HTMLElement) {
  const anchors = container.querySelectorAll('a');
  anchors.forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    const href = a.getAttribute('href') || '';
    if (href) {
      a.setAttribute('title', `Ctrl+Click to open (${href})`);
    }
    a.style.color = '#0068f9';
    a.style.textDecoration = 'underline';
    a.style.fontWeight = '500';
    a.style.cursor = 'pointer';
  });
}

export function executeRichTextCommand(
  editorEl: HTMLElement,
  action: string,
  value?: string
): { activeButtons: string[]; textAlign?: 'left' | 'center' | 'right' } {
  // Preserve existing range if already inside editorEl
  const existingSel = window.getSelection();
  if (!existingSel || existingSel.rangeCount === 0 || !editorEl.contains(existingSel.anchorNode)) {
    editorEl.focus();
  }

  switch (action) {
    case 'undo':
      document.execCommand('undo', false);
      break;
    case 'redo':
      document.execCommand('redo', false);
      break;
    case 'bold':
      document.execCommand('bold', false);
      break;
    case 'italic':
      document.execCommand('italic', false);
      break;
    case 'underline':
      document.execCommand('underline', false);
      break;
    case 'strikethrough':
      document.execCommand('strikeThrough', false);
      break;
    case 'link': {
      const sel = window.getSelection();
      let rawText = sel ? sel.toString() : '';
      const trimmedText = rawText.trim();

      // Adjust range to omit trailing/leading spaces if selected
      if (sel && sel.rangeCount > 0 && rawText && trimmedText !== rawText) {
        try {
          const range = sel.getRangeAt(0);
          const currentText = range.toString();
          const startOffset = currentText.indexOf(trimmedText);
          if (startOffset !== -1 && range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
            const origStart = range.startOffset;
            range.setStart(range.startContainer, origStart + startOffset);
            range.setEnd(range.startContainer, origStart + startOffset + trimmedText.length);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } catch {
          // ignore selection trimming error
        }
      }

      // Check if cursor/selection is already inside an existing link
      let existingAnchor: HTMLAnchorElement | null = null;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'A') {
            existingAnchor = node as HTMLAnchorElement;
            break;
          }
          node = node.parentNode;
        }
      }

      let targetUrl = value ? normalizeUrl(value) : '';

      // If user selected text that matches link format (e.g. https://pofeiportfolio.vercel.app/)
      if (!targetUrl && isUrlLike(trimmedText)) {
        targetUrl = normalizeUrl(trimmedText);
      }

      if (targetUrl) {
        if (sel && sel.isCollapsed) {
          // If no text was selected, insert anchor element
          const link = document.createElement('a');
          link.href = targetUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = targetUrl;
          link.style.color = '#0068f9';
          link.style.textDecoration = 'underline';
          link.style.fontWeight = '500';
          link.style.cursor = 'pointer';
          const range = sel.getRangeAt(0);
          range.insertNode(link);
          range.setStartAfter(link);
          range.setEndAfter(link);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          document.execCommand('createLink', false, targetUrl);
        }
        formatAnchors(editorEl);
        break;
      }

      // If currently on an anchor and user clicks Link with no URL, unlink/remove
      if (existingAnchor) {
        const parent = existingAnchor.parentNode;
        if (parent) {
          while (existingAnchor.firstChild) {
            parent.insertBefore(existingAnchor.firstChild, existingAnchor);
          }
          parent.removeChild(existingAnchor);
        } else {
          document.execCommand('unlink', false);
        }
        break;
      }

      // Fallback prompt for browsers that allow modal prompts
      try {
        const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
        if (url && url.trim() && url.trim() !== 'https://') {
          document.execCommand('createLink', false, normalizeUrl(url.trim()));
          formatAnchors(editorEl);
        }
      } catch (err) {
        console.warn('Modal prompt not available:', err);
      }
      break;
    }
    case 'unlink': {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'A') {
            const anchor = node as HTMLAnchorElement;
            const parent = anchor.parentNode;
            if (parent) {
              while (anchor.firstChild) {
                parent.insertBefore(anchor.firstChild, anchor);
              }
              parent.removeChild(anchor);
            }
            break;
          }
          node = node.parentNode;
        }
      }
      document.execCommand('unlink', false);
      break;
    }
    case 'bullet':
    case 'list':
    case 'insertUnorderedList': {
      document.execCommand('insertUnorderedList', false);
      break;
    }
    case 'heading': {
      const sel = window.getSelection();
      let isHeading = false;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'H1' || node.nodeName === 'H2' || node.nodeName === 'H3') {
            isHeading = true;
            break;
          }
          node = node.parentNode;
        }
      }
      if (isHeading) {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, '<h2>');
      }
      break;
    }
    case 'quote': {
      const sel = window.getSelection();
      let isQuote = false;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'BLOCKQUOTE') {
            isQuote = true;
            break;
          }
          node = node.parentNode;
        }
      }
      if (isQuote) {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, '<blockquote>');
      }
      break;
    }
    case 'highlight': {
      const sel = window.getSelection();
      let isHighlighted = false;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (
            node.nodeName === 'MARK' ||
            ((node as HTMLElement).style && (node as HTMLElement).style.backgroundColor && (node as HTMLElement).style.backgroundColor !== 'transparent')
          ) {
            isHighlighted = true;
            break;
          }
          node = node.parentNode;
        }
      }
      if (isHighlighted) {
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('backColor', false, 'transparent');
      } else {
        // Apply soft yellow highlighter
        const ok = document.execCommand('hiliteColor', false, '#fef08a');
        if (!ok) {
          document.execCommand('backColor', false, '#fef08a');
        }
      }
      break;
    }
    case 'color': {
      const color = value || '#0068f9';
      document.execCommand('foreColor', false, color);
      break;
    }
    case 'align-left':
    case 'align-center':
    case 'align-right': {
      const alignVal = action.replace('align-', '') as 'left' | 'center' | 'right';
      const cmd = alignVal === 'center' ? 'justifyCenter' : alignVal === 'right' ? 'justifyRight' : 'justifyLeft';
      
      // 1. Run native browser justify command
      document.execCommand(cmd, false);

      // 2. Identify and enforce inline style on the enclosing block elements of the current selection
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const getBlockAncestor = (node: Node | null): HTMLElement | null => {
          let curr = node;
          while (curr && curr !== editorEl) {
            if (curr.nodeType === Node.ELEMENT_NODE) {
              const el = curr as HTMLElement;
              const tag = el.tagName.toLowerCase();
              if (['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'li', 'div'].includes(tag)) {
                return el;
              }
            }
            curr = curr.parentNode;
          }
          return null;
        };

        const startBlock = getBlockAncestor(sel.anchorNode);
        const endBlock = getBlockAncestor(sel.focusNode);

        if (startBlock && startBlock !== editorEl) {
          startBlock.style.textAlign = alignVal;
        }
        if (endBlock && endBlock !== editorEl && endBlock !== startBlock) {
          endBlock.style.textAlign = alignVal;
        }

        // If the selection text is a direct child of editorEl without a block container, wrap or ensure parent element is styled
        if (!startBlock) {
          const parentEl = sel.anchorNode?.parentElement;
          if (parentEl && parentEl !== editorEl) {
            parentEl.style.textAlign = alignVal;
          }
        }
      }
      break;
    }
    default:
      break;
  }

  return queryEditorState(editorEl);
}

export function queryEditorState(editorEl: HTMLElement): {
  activeButtons: string[];
  textAlign: 'left' | 'center' | 'right';
} {
  const active: string[] = [];
  let textAlign: 'left' | 'center' | 'right' = 'left';

  try {
    if (document.queryCommandState('bold')) active.push('bold');
    if (document.queryCommandState('italic')) active.push('italic');
    if (document.queryCommandState('underline')) active.push('underline');
    if (document.queryCommandState('strikeThrough')) active.push('strikethrough');
    if (document.queryCommandState('insertUnorderedList')) active.push('bullet');

    let detectedAlign: 'left' | 'center' | 'right' = 'left';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode) {
      let curr: Node | null = sel.anchorNode;
      while (curr && curr !== editorEl) {
        if (curr.nodeType === Node.ELEMENT_NODE) {
          const el = curr as HTMLElement;
          const inlineAlign = (el.style?.textAlign || el.getAttribute('align') || '').toLowerCase();
          if (inlineAlign === 'center' || inlineAlign === 'right' || inlineAlign === 'left') {
            detectedAlign = inlineAlign as 'left' | 'center' | 'right';
            break;
          }
        }
        curr = curr.parentNode;
      }
    }

    if (detectedAlign === 'left') {
      if (document.queryCommandState('justifyCenter')) detectedAlign = 'center';
      else if (document.queryCommandState('justifyRight')) detectedAlign = 'right';
    }
    textAlign = detectedAlign;

    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== editorEl) {
        if (node.nodeName === 'H1' || node.nodeName === 'H2' || node.nodeName === 'H3') {
          active.push('heading');
        }
        if (node.nodeName === 'BLOCKQUOTE') {
          active.push('quote');
        }
        if (node.nodeName === 'A') {
          active.push('link');
        }
        if (
          node.nodeName === 'MARK' ||
          ((node as HTMLElement).style &&
            (node as HTMLElement).style.backgroundColor &&
            (node as HTMLElement).style.backgroundColor !== 'transparent')
        ) {
          active.push('highlight');
        }
        if ((node as HTMLElement).style && (node as HTMLElement).style.color) {
          active.push('color');
        }
        node = node.parentNode;
      }
    }
  } catch {
    // queryCommandState may be unsupported in edge scenarios
  }

  return { activeButtons: active, textAlign };
}
