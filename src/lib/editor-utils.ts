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
 * Automatically paginates HTML content across multiple A4 pages if it exceeds page height.
 * Accurately measures true content height in an off-screen sandbox matching container styling.
 */
export function paginateHtml(
  containerEl: HTMLElement,
  fullHtml: string
): string[] {
  if (!fullHtml || !fullHtml.trim() || fullHtml === '<p><br></p>') {
    return ['<p><br></p>'];
  }

  // Create an off-screen measurement sandbox with exact width & typography of containerEl
  const computedStyle = window.getComputedStyle(containerEl);
  const sandbox = document.createElement('div');
  sandbox.style.position = 'absolute';
  sandbox.style.visibility = 'hidden';
  sandbox.style.left = '-9999px';
  sandbox.style.top = '0';
  sandbox.style.width = `${containerEl.clientWidth > 100 ? containerEl.clientWidth : 698}px`;
  sandbox.style.fontFamily = computedStyle.fontFamily;
  sandbox.style.fontSize = computedStyle.fontSize;
  sandbox.style.lineHeight = computedStyle.lineHeight;
  sandbox.style.letterSpacing = computedStyle.letterSpacing;
  sandbox.style.boxSizing = 'border-box';
  sandbox.style.wordBreak = 'break-word';
  sandbox.className = containerEl.className;
  document.body.appendChild(sandbox);

  // Target maximum height per page (true usable text area before footer boundary)
  // For A4 (1123px total sheet height - 150px padding/header/footer) ~ 960px
  const maxPageHeight = containerEl.clientHeight > 500 ? containerEl.clientHeight - 10 : 960;

  sandbox.innerHTML = fullHtml;

  // If entire content fits in 1 page, return single page immediately
  if (sandbox.offsetHeight <= maxPageHeight) {
    document.body.removeChild(sandbox);
    return [fullHtml];
  }

  // Extract source DOM nodes
  const sourceNodes = Array.from(sandbox.childNodes).map(n => n.cloneNode(true));
  sandbox.innerHTML = '';

  const pagesHtml: string[] = [];
  let currentPageDiv = document.createElement('div');
  sandbox.appendChild(currentPageDiv);

  const startNewPage = () => {
    if (currentPageDiv.innerHTML.trim()) {
      pagesHtml.push(currentPageDiv.innerHTML);
    }
    currentPageDiv.innerHTML = '';
  };

  const addBlockIncrementally = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) return;
      const p = document.createElement('p');
      p.textContent = node.textContent;
      node = p;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Headings (H1-H6): if heading fits, add it; if it overflows, move to next page
    if (/^h[1-6]$/.test(tagName)) {
      currentPageDiv.appendChild(el.cloneNode(true));
      if (currentPageDiv.offsetHeight > maxPageHeight) {
        currentPageDiv.removeChild(currentPageDiv.lastChild!);
        if (currentPageDiv.innerHTML.trim()) {
          startNewPage();
        }
        currentPageDiv.appendChild(el.cloneNode(true));
      }
      return;
    }

    // Try adding whole element first
    currentPageDiv.appendChild(el.cloneNode(true));
    if (currentPageDiv.offsetHeight <= maxPageHeight) {
      // Fits completely on current page!
      return;
    }

    // Overflow! Remove it from current page
    currentPageDiv.removeChild(currentPageDiv.lastChild!);

    // If it's a list (UL/OL), paginate item by item
    if (tagName === 'ul' || tagName === 'ol') {
      let activeList = document.createElement(tagName);
      currentPageDiv.appendChild(activeList);

      const items = Array.from(el.children);
      for (const item of items) {
        activeList.appendChild(item.cloneNode(true));
        if (currentPageDiv.offsetHeight > maxPageHeight) {
          activeList.removeChild(activeList.lastChild!);
          if (activeList.children.length === 0 && activeList.parentNode) {
            currentPageDiv.removeChild(activeList);
          }
          startNewPage();
          activeList = document.createElement(tagName);
          currentPageDiv.appendChild(activeList);
          activeList.appendChild(item.cloneNode(true));
        }
      }
      return;
    }

    // Paragraph or generic block: add sentence by sentence to fully utilize every space on this page
    const fullText = el.innerHTML;
    const chunks = fullText.match(/<[^>]+>|[^<>.!?\n]+[.!?\n]*|[^<>.!?\n]+$/g) || [fullText];

    let currentChunkEl = document.createElement(tagName);
    currentPageDiv.appendChild(currentChunkEl);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prevHtml = currentChunkEl.innerHTML;
      currentChunkEl.innerHTML = prevHtml ? `${prevHtml} ${chunk}` : chunk;

      if (currentPageDiv.offsetHeight > maxPageHeight) {
        // Revert last chunk: this page is now 100% full!
        currentChunkEl.innerHTML = prevHtml;

        if (currentChunkEl.innerHTML.trim()) {
          startNewPage();
        } else {
          if (currentChunkEl.parentNode) {
            currentPageDiv.removeChild(currentChunkEl);
          }
          startNewPage();
        }

        // Continue with the remaining content on the next page
        currentChunkEl = document.createElement(tagName);
        currentPageDiv.appendChild(currentChunkEl);
        currentChunkEl.innerHTML = chunk;
      }
    }

    if (!currentChunkEl.innerHTML.trim() && currentChunkEl.parentNode) {
      currentPageDiv.removeChild(currentChunkEl);
    }
  };

  for (const node of sourceNodes) {
    addBlockIncrementally(node);
  }

  // Push final page
  if (currentPageDiv.innerHTML.trim()) {
    pagesHtml.push(currentPageDiv.innerHTML);
  }

  // Clean up sandbox
  document.body.removeChild(sandbox);

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

function findEnclosingBlock(node: Node | null, editorEl: HTMLElement): HTMLElement | null {
  let curr: Node | null = node;
  while (curr && curr !== editorEl) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as HTMLElement;
      if (/^(H[1-6]|P|DIV|BLOCKQUOTE|LI)$/i.test(el.nodeName)) {
        return el;
      }
    }
    curr = curr.parentNode;
  }
  return null;
}

function findEnclosingHeading(sel: Selection | null, editorEl: HTMLElement): HTMLElement | null {
  if (!sel || sel.rangeCount === 0) return null;
  
  // 1. Check anchorNode
  let node: Node | null = sel.anchorNode;
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/i.test(node.nodeName)) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }

  // 2. Check focusNode
  node = sel.focusNode;
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/i.test(node.nodeName)) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }

  // 3. Check commonAncestorContainer
  const range = sel.getRangeAt(0);
  node = range.commonAncestorContainer;
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/i.test(node.nodeName)) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }

  // 4. Check if the range contents or startContainer/endContainer contain a heading
  if (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE) {
    const parentEl = range.commonAncestorContainer as HTMLElement;
    const headings = parentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i] as HTMLElement;
      if (sel.containsNode(h, true) || range.intersectsNode(h)) {
        return h;
      }
    }
  }

  return null;
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
      const existingHeading = findEnclosingHeading(sel, editorEl);

      if (existingHeading) {
        // UNCHECK HEADING: Revert back to normal paragraph <p>
        let ok = false;
        try {
          ok = document.execCommand('formatBlock', false, '<p>');
          if (!ok) ok = document.execCommand('formatBlock', false, 'p');
          if (!ok) ok = document.execCommand('formatBlock', false, '<P>');
        } catch {}

        // Verify if still in heading
        const stillHeading = findEnclosingHeading(window.getSelection(), editorEl);
        if (stillHeading || (existingHeading.isConnected && /^H[1-6]$/i.test(existingHeading.nodeName))) {
          const targetToReplace = stillHeading || existingHeading;
          if (targetToReplace.parentNode) {
            const p = document.createElement('p');
            while (targetToReplace.firstChild) {
              p.appendChild(targetToReplace.firstChild);
            }
            targetToReplace.parentNode.replaceChild(p, targetToReplace);

            // Restore selection onto the new paragraph
            const newRange = document.createRange();
            newRange.selectNodeContents(p);
            const curSel = window.getSelection();
            if (curSel) {
              curSel.removeAllRanges();
              curSel.addRange(newRange);
            }
          }
        }
      } else {
        // CHECK HEADING: Turn block into <h2>
        let ok = false;
        try {
          ok = document.execCommand('formatBlock', false, '<h2>');
          if (!ok) ok = document.execCommand('formatBlock', false, 'h2');
          if (!ok) ok = document.execCommand('formatBlock', false, '<H2>');
        } catch {}

        const nowHeading = findEnclosingHeading(window.getSelection(), editorEl);
        if (!nowHeading && sel && sel.rangeCount > 0) {
          const block = findEnclosingBlock(sel.anchorNode, editorEl) || findEnclosingBlock(sel.focusNode, editorEl);
          if (block && block.parentNode && !/^H[1-6]$/i.test(block.nodeName)) {
            const h2 = document.createElement('h2');
            while (block.firstChild) {
              h2.appendChild(block.firstChild);
            }
            block.parentNode.replaceChild(h2, block);

            const newRange = document.createRange();
            newRange.selectNodeContents(h2);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
      }
      break;
    }
    case 'quote': {
      const sel = window.getSelection();
      let quoteEl: HTMLElement | null = null;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'BLOCKQUOTE') {
            quoteEl = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }
        if (!quoteEl) {
          node = sel.focusNode;
          while (node && node !== editorEl) {
            if (node.nodeName === 'BLOCKQUOTE') {
              quoteEl = node as HTMLElement;
              break;
            }
            node = node.parentNode;
          }
        }
      }

      if (quoteEl) {
        // UNCHECK QUOTE: Revert back to normal paragraph <p>
        let ok = false;
        try {
          ok = document.execCommand('formatBlock', false, '<p>');
          if (!ok) ok = document.execCommand('formatBlock', false, 'p');
          if (!ok) ok = document.execCommand('formatBlock', false, '<P>');
        } catch {}

        let stillQuote: HTMLElement | null = null;
        const curSel = window.getSelection();
        if (curSel && curSel.rangeCount > 0) {
          let n: Node | null = curSel.anchorNode;
          while (n && n !== editorEl) {
            if (n.nodeName === 'BLOCKQUOTE') { stillQuote = n as HTMLElement; break; }
            n = n.parentNode;
          }
        }

        if (stillQuote || (quoteEl.isConnected && quoteEl.nodeName === 'BLOCKQUOTE')) {
          const target = stillQuote || quoteEl;
          if (target.parentNode) {
            const p = document.createElement('p');
            while (target.firstChild) {
              p.appendChild(target.firstChild);
            }
            target.parentNode.replaceChild(p, target);

            const newRange = document.createRange();
            newRange.selectNodeContents(p);
            if (curSel) {
              curSel.removeAllRanges();
              curSel.addRange(newRange);
            }
          }
        }
      } else {
        // CHECK QUOTE: Turn into blockquote
        let ok = false;
        try {
          ok = document.execCommand('formatBlock', false, '<blockquote>');
          if (!ok) ok = document.execCommand('formatBlock', false, 'blockquote');
        } catch {}

        let nowQuote = false;
        const curSel = window.getSelection();
        if (curSel && curSel.rangeCount > 0) {
          let n: Node | null = curSel.anchorNode;
          while (n && n !== editorEl) {
            if (n.nodeName === 'BLOCKQUOTE') { nowQuote = true; break; }
            n = n.parentNode;
          }
        }

        if (!nowQuote && sel && sel.rangeCount > 0) {
          const block = findEnclosingBlock(sel.anchorNode, editorEl) || findEnclosingBlock(sel.focusNode, editorEl);
          if (block && block.parentNode && block.nodeName !== 'BLOCKQUOTE') {
            const bq = document.createElement('blockquote');
            while (block.firstChild) {
              bq.appendChild(block.firstChild);
            }
            block.parentNode.replaceChild(bq, block);

            const newRange = document.createRange();
            newRange.selectNodeContents(bq);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
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
      const headingEl = findEnclosingHeading(sel, editorEl);
      if (headingEl) {
        active.push('heading');
      }

      let isQuote = false;
      let isLink = false;

      let node: Node | null = sel.anchorNode;
      while (node && node !== editorEl) {
        if (node.nodeName === 'BLOCKQUOTE') {
          isQuote = true;
        }
        if (node.nodeName === 'A') {
          isLink = true;
        }
        if (
          node.nodeName === 'MARK' ||
          ((node as HTMLElement).style &&
            (node as HTMLElement).style.backgroundColor &&
            (node as HTMLElement).style.backgroundColor !== 'transparent')
        ) {
          if (!active.includes('highlight')) active.push('highlight');
        }
        if ((node as HTMLElement).style && (node as HTMLElement).style.color) {
          if (!active.includes('color')) active.push('color');
        }
        node = node.parentNode;
      }

      let fNode: Node | null = sel.focusNode;
      while (fNode && fNode !== editorEl) {
        if (fNode.nodeName === 'BLOCKQUOTE') {
          isQuote = true;
        }
        if (fNode.nodeName === 'A') {
          isLink = true;
        }
        fNode = fNode.parentNode;
      }

      if (isQuote && !active.includes('quote')) active.push('quote');
      if (isLink && !active.includes('link')) active.push('link');
    }
  } catch {
    // queryCommandState may be unsupported in edge scenarios
  }

  return { activeButtons: active, textAlign };
}
