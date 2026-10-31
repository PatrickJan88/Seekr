import PDFDocument from 'pdfkit';
import { JSDOM } from 'jsdom';

interface GeneratePdfOptions {
  title?: string;
  filename?: string;
}

interface StyleContext {
  isBold: boolean;
  isItalic: boolean;
  color: string;
  fontSize: number;
  isUnderline: boolean;
  link?: string;
  isMark?: boolean;
}

interface InlineToken {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  underline: boolean;
  link?: string;
  isMark?: boolean;
}

export async function generatePdfFromHtml(html: string, options: GeneratePdfOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract document title
      const pageTitle = options.title || document.querySelector('title')?.textContent?.trim() || 'Document';

      // Inspect style cues and preset indicators prior to stripping style elements
      const styleTagContent = document.querySelector('style')?.textContent || '';
      const bodyEl = document.body;
      const bodyStyleAttr = bodyEl?.getAttribute('style') || '';
      const dataStyleAttr = bodyEl?.getAttribute('data-style') || document.querySelector('[data-style]')?.getAttribute('data-style') || '';
      const dataStudio = bodyEl?.getAttribute('data-studio') || document.querySelector('[data-studio]')?.getAttribute('data-studio') || '';
      const rawTemplate = bodyEl?.getAttribute('data-template') || document.querySelector('[data-template]')?.getAttribute('data-template') || '';
      const combinedStyle = `${styleTagContent} ${bodyStyleAttr} ${dataStyleAttr} ${html}`.toLowerCase();

      // Check whether this export originates from Resume Studio
      const isResumeStudio =
        dataStudio === 'resume' ||
        ['classic-single', 'modern-single', 'classic-two', 'modern-two'].includes(rawTemplate) ||
        combinedStyle.includes('tailored resume') ||
        (document.querySelector('.layout-grid, .side-panel, .wrapper > .side-panel') !== null &&
          (document.querySelector('.exp-header') !== null || document.querySelector('.main-h') !== null));

      let resumeTemplate = rawTemplate;
      if (!resumeTemplate && isResumeStudio) {
        if (document.querySelector('.wrapper') || document.querySelector('.side-panel') || document.querySelector('.main-h')) {
          resumeTemplate = 'modern-two';
        } else if (document.querySelector('.layout-grid') || document.querySelector('.sidebar')) {
          resumeTemplate = 'classic-two';
        } else if (combinedStyle.includes('times') || combinedStyle.includes('georgia') || combinedStyle.includes('classic')) {
          resumeTemplate = 'classic-single';
        } else {
          resumeTemplate = 'modern-single';
        }
      }

      const isStudioA4 = document.querySelector('.a4-page-sheet') !== null || html.includes('a4-page-sheet');

      // Style preset detection (Classic, Executive, Academic use serif typography; Modern uses sans-serif)
      const isSerif =
        dataStyleAttr === 'classic' ||
        dataStyleAttr === 'executive' ||
        dataStyleAttr === 'academic' ||
        resumeTemplate === 'classic-single' ||
        resumeTemplate === 'classic-two' ||
        combinedStyle.includes('times new roman') ||
        combinedStyle.includes('georgia') ||
        combinedStyle.includes('computer modern') ||
        combinedStyle.includes('font-serif');

      const baseFont = isSerif ? 'Times-Roman' : 'Helvetica';
      const boldFont = isSerif ? 'Times-Bold' : 'Helvetica-Bold';
      const italicFont = isSerif ? 'Times-Italic' : 'Helvetica-Oblique';
      const boldItalicFont = isSerif ? 'Times-BoldItalic' : 'Helvetica-BoldOblique';

      function getFont(isBold: boolean, isItalic: boolean): string {
        if (isBold && isItalic) return boldItalicFont;
        if (isBold) return boldFont;
        if (isItalic) return italicFont;
        return baseFont;
      }

      // Remove non-content elements and existing HTML-level print footers
      document.querySelectorAll('script, style, noscript, .page-footer-print').forEach(el => el.remove());

      // Margins:
      // For Resume Studio: 0.5in (36pt) margins for balanced, uncompressed 1-page presentation
      // For Studio A4 documents: 22mm (62.4pt)
      const docMargins = isResumeStudio
        ? { top: 36, bottom: 36, left: 36, right: 36 }
        : (isStudioA4 ? { top: 62, bottom: 56, left: 62.4, right: 62.4 } : { top: 36, bottom: 45, left: 36, right: 36 });

      // Create PDFKit document (Letter size for Resume Studio, A4 for European / general studios)
      const doc = new PDFDocument({
        size: isResumeStudio ? 'letter' : 'A4',
        margins: docMargins,
        bufferPages: true,
        info: {
          Title: pageTitle,
          Author: 'Seekr Application Studio',
          Creator: 'Seekr PDF Engine',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const maxY = doc.page.height - doc.page.margins.bottom;
      let hasRenderedContent = false;

      function checkPageBreak(neededHeight: number = 25) {
        if (doc.y + neededHeight > maxY) {
          doc.addPage();
        }
      }

      function cleanText(text: string | null | undefined): string {
        if (!text) return '';
        return text
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function hasClass(el: HTMLElement, targetClass: string): boolean {
        const classes = (el.className || '').split(/\s+/);
        return classes.includes(targetClass);
      }

      function hasBlockChildren(element: HTMLElement): boolean {
        return element.querySelector('p, div, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, table, hr') !== null;
      }

      function collectTokens(node: Node, ctx: StyleContext, tokens: InlineToken[]) {
        if (node.nodeType === 3) {
          const raw = node.textContent || '';
          if (!raw) return;
          const hasLeading = /^\s/.test(raw);
          const hasTrailing = /\s$/.test(raw);
          const clean = raw
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (!clean) {
            if (hasLeading || hasTrailing) {
              tokens.push({
                text: ' ',
                font: getFont(ctx.isBold, ctx.isItalic),
                fontSize: ctx.fontSize,
                color: ctx.color,
                underline: ctx.isUnderline,
                link: ctx.link,
                isMark: ctx.isMark,
              });
            }
            return;
          }
          const tokenText = (hasLeading ? ' ' : '') + clean + (hasTrailing ? ' ' : '');
          tokens.push({
            text: tokenText,
            font: getFont(ctx.isBold, ctx.isItalic),
            fontSize: ctx.fontSize,
            color: ctx.color,
            underline: ctx.isUnderline,
            link: ctx.link,
            isMark: ctx.isMark,
          });
          return;
        }

        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          // Handle explicit HTML line breaks (<br/>)
          if (tag === 'br') {
            tokens.push({
              text: '\n',
              font: getFont(ctx.isBold, ctx.isItalic),
              fontSize: ctx.fontSize,
              color: ctx.color,
              underline: false,
            });
            return;
          }

          const styleAttr = el.getAttribute('style') || '';
          const classAttr = el.className || '';

          const nextBold =
            ctx.isBold ||
            tag === 'strong' ||
            tag === 'b' ||
            classAttr.includes('font-bold') ||
            styleAttr.includes('font-weight: bold') ||
            /font-weight:\s*(?:700|800|900)/.test(styleAttr);

          const nextItalic =
            ctx.isItalic ||
            tag === 'em' ||
            tag === 'i' ||
            classAttr.includes('italic') ||
            styleAttr.includes('font-style: italic');

          let nextUnderline = ctx.isUnderline || tag === 'u' || styleAttr.includes('text-decoration: underline');
          let nextColor = ctx.color;
          let nextLink = ctx.link;
          const nextMark = ctx.isMark || tag === 'mark';

          if (tag === 'a') {
            nextColor = '#0068f9';
            nextUnderline = true;
            nextLink = el.getAttribute('href') || undefined;
          } else if (tag === 'mark') {
            nextColor = '#713f12';
          }

          const colorMatch = styleAttr.match(/color:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/i);
          if (colorMatch && colorMatch[1]) {
            nextColor = colorMatch[1];
          }

          const nextCtx: StyleContext = {
            isBold: nextBold,
            isItalic: nextItalic,
            color: nextColor,
            fontSize: ctx.fontSize,
            isUnderline: nextUnderline,
            link: nextLink,
            isMark: nextMark,
          };

          for (let i = 0; i < el.childNodes.length; i++) {
            collectTokens(el.childNodes[i], nextCtx, tokens);
          }
        }
      }

      function renderInlineContainer(
        containerEl: HTMLElement,
        baseFontSize: number,
        defaultLineGap: number,
        initialFont?: string,
        initialColor?: string,
        targetWidth: number = pageWidth,
        startX?: number,
        align: 'left' | 'center' | 'right' | 'justify' = 'left'
      ) {
        const isInitialBold = initialFont === boldFont || initialFont === boldItalicFont;
        const isInitialItalic = initialFont === italicFont || initialFont === boldItalicFont;
        const initialCtx: StyleContext = {
          isBold: isInitialBold,
          isItalic: isInitialItalic,
          color: initialColor || '#1e293b',
          fontSize: baseFontSize,
          isUnderline: false,
        };

        const rawTokens: InlineToken[] = [];
        for (let i = 0; i < containerEl.childNodes.length; i++) {
          collectTokens(containerEl.childNodes[i], initialCtx, rawTokens);
        }

        const mergedTokens: InlineToken[] = [];
        for (const tok of rawTokens) {
          if (tok.text === '') continue;
          const last = mergedTokens[mergedTokens.length - 1];
          if (
            last &&
            last.font === tok.font &&
            last.fontSize === tok.fontSize &&
            last.color === tok.color &&
            last.underline === tok.underline &&
            last.link === tok.link &&
            last.isMark === tok.isMark
          ) {
            last.text += tok.text;
          } else {
            mergedTokens.push({ ...tok });
          }
        }

        if (mergedTokens.length === 0) return;

        const currentX = startX !== undefined ? startX : doc.x;
        const currentY = doc.y;

        mergedTokens.forEach((token, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === mergedTokens.length - 1;
          doc.font(token.font)
             .fontSize(token.fontSize)
             .fillColor(token.color);

          if (isFirst) {
            doc.text(token.text, currentX, currentY, {
              continued: !isLast,
              lineGap: defaultLineGap,
              width: targetWidth,
              align: align,
              underline: token.underline,
              link: token.link,
            });
          } else {
            doc.text(token.text, {
              continued: !isLast,
              lineGap: defaultLineGap,
              width: targetWidth,
              align: align,
              underline: token.underline,
              link: token.link,
            });
          }
        });
        hasRenderedContent = true;
      }

      // =========================================================================
      // DEDICATED RESUME STUDIO RENDERER (Classic & Modern Single/Two-Column)
      // Renders the exact lines, layouts, and spacious typography seen in the Studio!
      // =========================================================================
      function renderResumeStudioLayout() {
        const startX = doc.page.margins.left;

        if (resumeTemplate === 'classic-single') {
          // ---------------------------------------------------------------------
          // 1. CLASSIC SINGLE COLUMN
          // Traditional ATS-standard layout with centered header and horizontal lines
          // ---------------------------------------------------------------------
          const headerEl = document.querySelector('.header');
          if (headerEl) {
            const name = cleanText(headerEl.querySelector('.name')?.textContent);
            const title = cleanText(headerEl.querySelector('.title')?.textContent);
            const contact = cleanText(headerEl.querySelector('.contact')?.textContent);

            if (name) {
              doc.font('Times-Bold').fontSize(22).fillColor('#111111').text(name.toUpperCase(), startX, doc.y, { align: 'center', width: pageWidth });
            }
            if (title) {
              doc.moveDown(0.2);
              doc.font('Times-Italic').fontSize(11).fillColor('#333333').text(title, startX, doc.y, { align: 'center', width: pageWidth });
            }
            if (contact) {
              doc.moveDown(0.2);
              doc.font('Times-Roman').fontSize(9.5).fillColor('#444444').text(contact, startX, doc.y, { align: 'center', width: pageWidth });
            }

            // Header bottom border line (1.5px solid #222)
            doc.moveDown(0.4);
            doc.strokeColor('#222222').lineWidth(1.5).moveTo(startX, doc.y).lineTo(startX + pageWidth, doc.y).stroke();
            doc.moveDown(0.55);
          }

          // Render Sections
          const sections = (Array.from(document.body.children) as HTMLElement[]).filter(el => !el.classList.contains('header') && !el.classList.contains('page-footer-print'));
          sections.forEach(el => {
            if (el.classList.contains('section-title')) {
              doc.moveDown(0.5);
              const titleText = cleanText(el.textContent).toUpperCase();
              doc.font('Times-Bold').fontSize(11.5).fillColor('#111111').text(titleText, startX, doc.y, { width: pageWidth });
              // Section title bottom line (1px solid #333)
              doc.strokeColor('#333333').lineWidth(1).moveTo(startX, doc.y + 3).lineTo(startX + pageWidth, doc.y + 3).stroke();
              doc.y += 8;
            } else if (el.classList.contains('item-block')) {
              renderResumeItemBlock(el, pageWidth, startX, 'classic');
            } else if (el.tagName.toLowerCase() === 'p') {
              doc.font('Times-Roman').fontSize(10).fillColor('#222222').text(cleanText(el.textContent), startX, doc.y, { width: pageWidth, lineGap: 3.5, align: 'justify' });
              doc.moveDown(0.35);
            } else {
              renderInlineContainer(el, 10, 3.5, 'Times-Roman', '#222222', pageWidth, startX);
              doc.moveDown(0.35);
            }
          });

        } else if (resumeTemplate === 'modern-single') {
          // ---------------------------------------------------------------------
          // 2. MODERN SINGLE COLUMN
          // Contemporary design with electric cobalt header line and inline section dividers
          // ---------------------------------------------------------------------
          const headerEl = document.querySelector('.header');
          if (headerEl) {
            const name = cleanText(headerEl.querySelector('.name')?.textContent);
            const title = cleanText(headerEl.querySelector('.title')?.textContent);
            const contact = cleanText(headerEl.querySelector('.contact')?.textContent);

            if (name) {
              doc.font('Helvetica-Bold').fontSize(24).fillColor('#0f172a').text(name, startX, doc.y, { width: pageWidth });
            }
            if (title) {
              doc.moveDown(0.2);
              doc.font('Helvetica-Bold').fontSize(12).fillColor('#0068f9').text(title, startX, doc.y, { width: pageWidth });
            }
            if (contact) {
              doc.moveDown(0.2);
              doc.font('Helvetica').fontSize(9.5).fillColor('#64748b').text(contact, startX, doc.y, { width: pageWidth });
            }

            // Header bottom border line (2px solid #0068f9)
            doc.moveDown(0.4);
            doc.strokeColor('#0068f9').lineWidth(2).moveTo(startX, doc.y).lineTo(startX + pageWidth, doc.y).stroke();
            doc.moveDown(0.6);
          }

          // Render Sections
          const sections = (Array.from(document.body.children) as HTMLElement[]).filter(el => !el.classList.contains('header') && !el.classList.contains('page-footer-print'));
          sections.forEach(el => {
            if (el.classList.contains('section-title')) {
              doc.moveDown(0.55);
              const titleText = cleanText(el.textContent).toUpperCase();
              doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#0f172a');
              const textW = doc.widthOfString(titleText);
              const curY = doc.y;
              doc.text(titleText, startX, curY, { continued: false });
              // Inline divider line extending from text end to right margin (1.2px solid #e2e8f0)
              const lineStartX = startX + textW + 10;
              const lineY = curY + 7;
              doc.strokeColor('#e2e8f0').lineWidth(1.2).moveTo(lineStartX, lineY).lineTo(startX + pageWidth, lineY).stroke();
              doc.y = curY + 18;
            } else if (el.classList.contains('item-block')) {
              renderResumeItemBlock(el, pageWidth, startX, 'modern');
            } else if (el.tagName.toLowerCase() === 'p') {
              doc.font('Helvetica').fontSize(10).fillColor('#334155').text(cleanText(el.textContent), startX, doc.y, { width: pageWidth, lineGap: 3.2 });
              doc.moveDown(0.35);
            } else if (el.querySelector('.pill')) {
              renderPillsBlock(el, pageWidth, startX);
            } else {
              renderInlineContainer(el, 10, 3.2, 'Helvetica', '#334155', pageWidth, startX);
              doc.moveDown(0.35);
            }
          });

        } else if (resumeTemplate === 'classic-two') {
          // ---------------------------------------------------------------------
          // 3. CLASSIC TWO COLUMN
          // Structured 30/70 split layout with vertical separator and header line
          // ---------------------------------------------------------------------
          const headerEl = document.querySelector('.header');
          if (headerEl) {
            const name = cleanText(headerEl.querySelector('.name')?.textContent);
            const title = cleanText(headerEl.querySelector('.title')?.textContent);

            if (name) {
              doc.font('Times-Bold').fontSize(22).fillColor('#111111').text(name.toUpperCase(), startX, doc.y, { width: pageWidth });
            }
            if (title) {
              doc.moveDown(0.2);
              doc.font('Times-Italic').fontSize(11).fillColor('#444444').text(title, startX, doc.y, { width: pageWidth });
            }

            // Header bottom border line (2px solid #222)
            doc.moveDown(0.35);
            doc.strokeColor('#222222').lineWidth(2).moveTo(startX, doc.y).lineTo(startX + pageWidth, doc.y).stroke();
            doc.moveDown(0.55);
          }

          // Two-column coordinates
          const sidebarWidth = 175;
          const colGap = 20;
          const mainWidth = pageWidth - sidebarWidth - colGap;
          const colStartY = doc.y;

          // Render Sidebar (Left Column)
          doc.x = startX;
          doc.y = colStartY;
          const sidebarEl = document.querySelector('.sidebar');
          if (sidebarEl) {
            Array.from(sidebarEl.children).forEach(child => {
              const el = child as HTMLElement;
              if (el.classList.contains('section-title')) {
                doc.moveDown(0.45);
                const st = cleanText(el.textContent).toUpperCase();
                doc.font('Times-Bold').fontSize(10.5).fillColor('#111111').text(st, startX, doc.y, { width: sidebarWidth });
                // Sidebar section line (1px solid #444)
                doc.strokeColor('#444444').lineWidth(1).moveTo(startX, doc.y + 3).lineTo(startX + sidebarWidth, doc.y + 3).stroke();
                doc.y += 7;
              } else {
                renderInlineContainer(el, 9.5, 3.5, 'Times-Roman', '#333333', sidebarWidth, startX);
                doc.moveDown(0.3);
              }
            });
          }
          const sidebarEndY = doc.y;

          // Render Main Column (Right Column)
          const mainX = startX + sidebarWidth + colGap;
          doc.x = mainX;
          doc.y = colStartY;
          const mainEl = document.querySelector('.main-col');
          if (mainEl) {
            Array.from(mainEl.children).forEach(child => {
              const el = child as HTMLElement;
              if (el.classList.contains('section-title')) {
                doc.moveDown(0.45);
                const st = cleanText(el.textContent).toUpperCase();
                doc.font('Times-Bold').fontSize(11).fillColor('#111111').text(st, mainX, doc.y, { width: mainWidth });
                // Main column section line (1px solid #444)
                doc.strokeColor('#444444').lineWidth(1).moveTo(mainX, doc.y + 3).lineTo(mainX + mainWidth, doc.y + 3).stroke();
                doc.y += 7;
              } else if (el.classList.contains('item-block')) {
                renderResumeItemBlock(el, mainWidth, mainX, 'classic');
              } else {
                renderInlineContainer(el, 10, 3.5, 'Times-Roman', '#222222', mainWidth, mainX);
                doc.moveDown(0.35);
              }
            });
          }
          const mainEndY = doc.y;

          // Draw Vertical Divider Line between Sidebar and Main Column (1px solid #ccc)
          // Extend until the up and bottom margins relative to the page are equal
          const dividerX = startX + sidebarWidth + Math.round(colGap / 2);
          const targetEndY = doc.page.height - colStartY;
          const maxColEndY = Math.max(sidebarEndY, mainEndY, targetEndY);
          doc.strokeColor('#cccccc').lineWidth(1).moveTo(dividerX, colStartY).lineTo(dividerX, maxColEndY).stroke();
          doc.x = startX;
          doc.y = maxColEndY + 12;

        } else if (resumeTemplate === 'modern-two') {
          // ---------------------------------------------------------------------
          // 4. MODERN TWO COLUMN
          // Sleek sidebar layout with distinct panel container, skill badges, and blue accent rules
          // ---------------------------------------------------------------------
          const sidebarWidth = 180;
          const colGap = 18;
          const mainWidth = pageWidth - sidebarWidth - colGap;
          const colStartY = doc.y;
          const innerPad = 12;
          const innerW = sidebarWidth - innerPad * 2;
          const innerX = startX + innerPad;

          // First pass: measure and render sidebar items
          doc.x = innerX;
          doc.y = colStartY + innerPad;
          const sidePanelEl = document.querySelector('.side-panel');
          if (sidePanelEl) {
            Array.from(sidePanelEl.children).forEach(child => {
              const el = child as HTMLElement;
              if (el.classList.contains('name')) {
                const name = cleanText(el.textContent);
                doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(name, innerX, doc.y, { width: innerW });
              } else if (el.classList.contains('title')) {
                const title = cleanText(el.textContent);
                doc.moveDown(0.2);
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#0068f9').text(title, innerX, doc.y, { width: innerW });
              } else if (el.classList.contains('section-h')) {
                doc.moveDown(0.45);
                const st = cleanText(el.textContent).toUpperCase();
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#475569').text(st, innerX, doc.y, { width: innerW });
                // Sidebar header divider (1px solid #cbd5e1)
                doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(innerX, doc.y + 3).lineTo(innerX + innerW, doc.y + 3).stroke();
                doc.y += 7;
              } else if (el.querySelector('.skill-tag')) {
                renderPillsBlock(el, innerW, innerX, '#e0e7ff', '#3730a3');
              } else {
                renderInlineContainer(el, 9, 3.2, 'Helvetica', '#475569', innerW, innerX);
                doc.moveDown(0.25);
              }
            });
          }
          const sidebarEndY = doc.y + innerPad;

          // Render Main Column (Right Column)
          const mainX = startX + sidebarWidth + colGap;
          doc.x = mainX;
          doc.y = colStartY;
          const mainEl = document.querySelector('.main-col') || document.querySelector('.wrapper > div:last-child');
          if (mainEl) {
            Array.from(mainEl.children).forEach(child => {
              const el = child as HTMLElement;
              if (el.classList.contains('main-h')) {
                doc.moveDown(0.45);
                const st = cleanText(el.textContent).toUpperCase();
                doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#0f172a').text(st, mainX, doc.y, { width: mainWidth });
                // Electric cobalt horizontal accent rule (2px solid #0068f9)
                doc.strokeColor('#0068f9').lineWidth(2).moveTo(mainX, doc.y + 3).lineTo(mainX + mainWidth, doc.y + 3).stroke();
                doc.y += 8;
              } else if (el.classList.contains('item-block')) {
                renderResumeItemBlock(el, mainWidth, mainX, 'modern');
              } else {
                renderInlineContainer(el, 9.8, 3.2, 'Helvetica', '#334155', mainWidth, mainX);
                doc.moveDown(0.3);
              }
            });
          }
          const mainEndY = doc.y;

          // Draw the Sidebar Container Box behind the panel
          const panelHeight = Math.max(sidebarEndY - colStartY, mainEndY - colStartY, 520);
          doc.save();
          doc.roundedRect(startX, colStartY, sidebarWidth, panelHeight, 6).strokeColor('#e2e8f0').lineWidth(1).stroke();
          doc.restore();

          doc.x = startX;
          doc.y = Math.max(sidebarEndY, mainEndY) + 12;
        }

        hasRenderedContent = true;
      }

      function renderResumeItemBlock(itemEl: HTMLElement, width: number, startX: number, mode: 'classic' | 'modern') {
        const isClassic = mode === 'classic';

        // Check if this is an Education item or a simple 2-column flex item without bullets
        const hasBullets = itemEl.querySelector('ul') !== null;
        const flexSpans = itemEl.querySelectorAll(':scope > div, :scope > span');

        if (!hasBullets && flexSpans.length >= 2 && !itemEl.querySelector('.exp-header')) {
          const leftEl = flexSpans[0] as HTMLElement;
          const rightEl = flexSpans[1] as HTMLElement;
          const curY = doc.y;
          const rightText = cleanText(rightEl.textContent);
          const rightW = rightText ? doc.widthOfString(rightText) + 12 : 0;

          // Render left side with inline formatting preserved
          renderInlineContainer(
            leftEl,
            isClassic ? 10 : 9.5,
            2.5,
            isClassic ? 'Times-Roman' : 'Helvetica',
            isClassic ? '#111111' : '#0f172a',
            width - rightW - 10,
            startX
          );

          // Render right side (year/period)
          if (rightText) {
            doc.font(isClassic ? 'Times-Roman' : 'Helvetica')
               .fontSize(isClassic ? 9.5 : 9)
               .fillColor(isClassic ? '#444444' : '#64748b')
               .text(rightText, startX, curY, { align: 'right', width: width });
          }
          doc.moveDown(0.35);
          return;
        }

        // Primary header line (Role or Company)
        const expHeader = itemEl.querySelector('.exp-header');
        const flexHeader = itemEl.querySelector('div[style*="justify-content: space-between"]');
        const boldDiv = itemEl.querySelector('div[style*="font-weight: bold"], div[style*="font-weight: 700"]');

        const curY = doc.y;

        if (expHeader || flexHeader) {
          const targetHeader = (expHeader || flexHeader)!;
          const spans = targetHeader.querySelectorAll(':scope > span, :scope > div');
          if (spans.length >= 2) {
            const leftText = cleanText(spans[0].textContent);
            const rightText = cleanText(spans[1].textContent);

            doc.font(isClassic ? 'Times-Bold' : 'Helvetica-Bold')
               .fontSize(isClassic ? 10.5 : 10.5)
               .fillColor(isClassic ? '#111111' : '#0f172a')
               .text(leftText, startX, curY, { width: width - 90 });

            if (rightText) {
              doc.font(isClassic ? 'Times-Roman' : 'Helvetica')
                 .fontSize(isClassic ? 9.5 : 9)
                 .fillColor(isClassic ? '#444444' : '#64748b')
                 .text(rightText, startX, curY, { align: 'right', width: width });
            }
          } else {
            const leftText = cleanText(targetHeader.textContent);
            doc.font(isClassic ? 'Times-Bold' : 'Helvetica-Bold')
               .fontSize(isClassic ? 10.5 : 10.5)
               .fillColor(isClassic ? '#111111' : '#0f172a')
               .text(leftText, startX, curY, { width: width });
          }
        } else if (boldDiv) {
          doc.font(isClassic ? 'Times-Bold' : 'Helvetica-Bold')
             .fontSize(isClassic ? 10.5 : 10.5)
             .fillColor(isClassic ? '#111111' : '#0f172a')
             .text(cleanText(boldDiv.textContent), startX, curY, { width: width });
        }

        // Sub-header line (Company or Role, Period, Location)
        const expSub = itemEl.querySelector('.exp-sub');
        const expCompany = itemEl.querySelector('.exp-company');
        const italicDiv = itemEl.querySelector('div[style*="font-style: italic"]');
        const blueDiv = itemEl.querySelector('div[style*="color: #0068f9"]');

        if (expSub) {
          const spans = expSub.querySelectorAll(':scope > span, :scope > div');
          const subY = doc.y;
          if (spans.length >= 2) {
            const leftText = cleanText(spans[0].textContent);
            const rightText = cleanText(spans[1].textContent);

            doc.font(isClassic ? 'Times-Italic' : 'Helvetica-Oblique')
               .fontSize(isClassic ? 10 : 9.5)
               .fillColor(isClassic ? '#333333' : '#64748b')
               .text(leftText, startX, subY, { width: width - 90 });

            if (rightText) {
              doc.font(isClassic ? 'Times-Italic' : 'Helvetica')
                 .fontSize(isClassic ? 9.5 : 9)
                 .fillColor(isClassic ? '#444444' : '#64748b')
                 .text(rightText, startX, subY, { align: 'right', width: width });
            }
          } else {
            doc.font(isClassic ? 'Times-Italic' : 'Helvetica-Oblique')
               .fontSize(isClassic ? 10 : 9.5)
               .fillColor(isClassic ? '#333333' : '#64748b')
               .text(cleanText(expSub.textContent), startX, subY, { width: width });
          }
        } else if (expCompany || blueDiv) {
          const compEl = expCompany || blueDiv;
          doc.font(isClassic ? 'Times-Bold' : 'Helvetica-Bold')
             .fontSize(isClassic ? 10 : 9.5)
             .fillColor('#0068f9')
             .text(cleanText(compEl?.textContent), startX, doc.y, { width: width });
        } else if (italicDiv) {
          doc.font(isClassic ? 'Times-Italic' : 'Helvetica-Oblique')
             .fontSize(isClassic ? 9.5 : 9)
             .fillColor(isClassic ? '#444444' : '#64748b')
             .text(cleanText(italicDiv.textContent), startX, doc.y, { width: width });
        }

        doc.moveDown(0.15);

        // Render bullet list
        const listItems = itemEl.querySelectorAll('ul > li');
        if (listItems.length > 0) {
          listItems.forEach(li => {
            const bX = startX + 10;
            const liTxt = cleanText(li.textContent);
            if (liTxt) {
              doc.font(isClassic ? 'Times-Roman' : 'Helvetica')
                 .fontSize(isClassic ? 9.6 : 9.3)
                 .fillColor(isClassic ? '#222222' : '#334155');
              doc.text('• ', bX, doc.y, { continued: true });
              doc.text(liTxt, { width: width - 14, lineGap: 3.2 });
              doc.moveDown(0.2);
            }
          });
        }
        doc.moveDown(0.35);
      }

      function renderPillsBlock(containerEl: HTMLElement, width: number, startX: number, bg: string = '#f1f5f9', fg: string = '#1e293b') {
        const pills = Array.from(containerEl.querySelectorAll('.pill, .skill-tag')).map(el => cleanText(el.textContent)).filter(Boolean);
        if (pills.length === 0) return;

        let curX = startX;
        let curY = doc.y;
        const rowHeight = 18;
        const pillPaddingX = 7;

        pills.forEach(pill => {
          doc.font('Helvetica-Bold').fontSize(8.5);
          const tW = doc.widthOfString(pill);
          const pillW = tW + pillPaddingX * 2;

          if (curX + pillW > startX + width) {
            curX = startX;
            curY += rowHeight + 5;
          }

          doc.roundedRect(curX, curY, pillW, rowHeight, 4).fillAndStroke(bg, '#e2e8f0');
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(fg).text(pill, curX + pillPaddingX, curY + 4);
          curX += pillW + 6;
        });

        doc.y = curY + rowHeight + 8;
        doc.x = startX;
      }

      // =========================================================================
      // STANDARD CLEAN DOCUMENT RENDERER (Cover Letter Studio, Interview Prep Studio)
      // Clean, unstroked, pristine typography matching studio editor sheets 100%
      // =========================================================================
      function renderStandardNode(node: Node) {
        if (node.nodeType === 3) {
          const text = cleanText(node.textContent);
          if (text) {
            checkPageBreak(16);
            doc.font(baseFont)
               .fontSize(isStudioA4 ? 10.5 : 9.5)
               .fillColor('#1e293b')
               .text(text, { lineGap: isStudioA4 ? 4.5 : 2.5, width: pageWidth });
            doc.moveDown(isStudioA4 ? 0.75 : 0.45);
            hasRenderedContent = true;
          }
          return;
        }

        if (node.nodeType !== 1) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const className = el.className || '';
        const style = el.getAttribute('style') || '';

        // Executive Style Accent Bar
        if (
          hasClass(el, 'executive-accent-bar') ||
          style.includes('border-top: 3px solid #0068f9')
        ) {
          checkPageBreak(25);
          doc.strokeColor('#0068f9')
             .lineWidth(3)
             .moveTo(doc.page.margins.left, doc.y)
             .lineTo(doc.page.width - doc.page.margins.right, doc.y)
             .stroke();
          doc.moveDown(0.8);
          hasRenderedContent = true;
          return;
        }

        // Multi-page break boundary
        if (
          hasRenderedContent &&
          (className.includes('a4-page-sheet') || className.includes('page-card') || style.includes('page-break-before')) &&
          doc.y > doc.page.margins.top + 30
        ) {
          doc.addPage();
        }

        // Story title / header
        if (hasClass(el, 'story-title-print')) {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(35);
            doc.moveDown(0.2);
            renderInlineContainer(el, 18, 3, boldFont, '#0f172a');
            doc.moveDown(0.35);
            hasRenderedContent = true;
            return;
          }
        }

        switch (tag) {
          case 'h1': {
            checkPageBreak(35);
            doc.moveDown(isStudioA4 ? 0.45 : 0.3);
            renderInlineContainer(el, isStudioA4 ? 18 : 17, isStudioA4 ? 3 : 2, boldFont, '#0f172a');
            doc.moveDown(isStudioA4 ? 0.35 : 0.25);
            break;
          }

          case 'h2': {
            checkPageBreak(28);
            doc.moveDown(isStudioA4 ? 0.4 : 0.25);
            renderInlineContainer(el, isStudioA4 ? 14 : 13, isStudioA4 ? 3 : 2, boldFont, '#0f172a');
            doc.moveDown(isStudioA4 ? 0.3 : 0.2);
            break;
          }

          case 'h3': {
            checkPageBreak(24);
            doc.moveDown(isStudioA4 ? 0.35 : 0.2);
            renderInlineContainer(el, isStudioA4 ? 12 : 11, isStudioA4 ? 2.5 : 1.5, boldFont, '#1e293b');
            doc.moveDown(isStudioA4 ? 0.25 : 0.15);
            break;
          }

          case 'h4':
          case 'h5':
          case 'h6': {
            checkPageBreak(20);
            doc.moveDown(isStudioA4 ? 0.25 : 0.15);
            renderInlineContainer(el, isStudioA4 ? 10.5 : 9.5, isStudioA4 ? 2.5 : 1.5, boldFont, '#334155');
            doc.moveDown(isStudioA4 ? 0.2 : 0.15);
            break;
          }

          case 'p': {
            checkPageBreak(22);
            const lines = el.innerHTML.split(/<br\s*\/?>/i);
            lines.forEach((lineHtml, lineIdx) => {
              const tempDom = new JSDOM(`<body>${lineHtml}</body>`);
              const pBody = tempDom.window.document.body;
              renderInlineContainer(pBody, isStudioA4 ? 10.5 : 9.5, isStudioA4 ? 4.5 : 2.5);
              if (lineIdx < lines.length - 1) {
                doc.moveDown(0.25);
              }
            });
            doc.moveDown(isStudioA4 ? 0.75 : 0.45);
            break;
          }

          case 'div': {
            if (hasBlockChildren(el)) {
              for (let i = 0; i < el.childNodes.length; i++) {
                renderStandardNode(el.childNodes[i]);
              }
            } else {
              const text = cleanText(el.textContent);
              if (text) {
                checkPageBreak(20);
                const lines = el.innerHTML.split(/<br\s*\/?>/i);
                lines.forEach((lineHtml, lineIdx) => {
                  const tempDom = new JSDOM(`<body>${lineHtml}</body>`);
                  const pBody = tempDom.window.document.body;
                  renderInlineContainer(pBody, isStudioA4 ? 10.5 : 9.5, isStudioA4 ? 4.5 : 2.5);
                  if (lineIdx < lines.length - 1) {
                    doc.moveDown(0.25);
                  }
                });
                doc.moveDown(isStudioA4 ? 0.75 : 0.45);
              }
            }
            break;
          }

          case 'br': {
            doc.moveDown(isStudioA4 ? 0.4 : 0.25);
            break;
          }

          case 'ul':
          case 'ol': {
            const items = el.querySelectorAll(':scope > li');
            items.forEach((li, idx) => {
              checkPageBreak(18);
              const bullet = tag === 'ol' ? `${idx + 1}. ` : '• ';
              const liText = cleanText(li.textContent);
              if (liText) {
                const prevX = doc.page.margins.left;
                doc.font(baseFont).fontSize(isStudioA4 ? 10.5 : 9.5).fillColor('#334155').text(bullet, prevX + 6, doc.y, { continued: true });
                renderInlineContainer(li as HTMLElement, isStudioA4 ? 10.5 : 9.5, isStudioA4 ? 3.5 : 2.5);
                doc.x = prevX;
                doc.moveDown(isStudioA4 ? 0.3 : 0.2);
                hasRenderedContent = true;
              }
            });
            doc.moveDown(isStudioA4 ? 0.4 : 0.25);
            break;
          }

          case 'blockquote': {
            const text = cleanText(el.textContent);
            if (text) {
              const quoteFontSize = isStudioA4 ? 10.5 : 9.5;
              doc.font(italicFont).fontSize(quoteFontSize);
              const textHeight = doc.heightOfString(text, {
                width: pageWidth - 28,
                lineGap: isStudioA4 ? 4 : 2.5,
              });
              const blockHeight = textHeight + 14;
              checkPageBreak(blockHeight + 12);
              const startX = doc.page.margins.left;
              const startY = doc.y;

              doc.rect(startX, startY, pageWidth, blockHeight).fill('#f8fafc');
              doc.strokeColor('#0068f9')
                 .lineWidth(3.5)
                 .moveTo(startX, startY)
                 .lineTo(startX, startY + blockHeight)
                 .stroke();

              doc.font(italicFont)
                 .fontSize(quoteFontSize)
                 .fillColor('#334155')
                 .text(text, startX + 14, startY + 7, {
                   width: pageWidth - 28,
                   lineGap: isStudioA4 ? 4 : 2.5,
                 });

              doc.x = startX;
              doc.y = startY + blockHeight + (isStudioA4 ? 12 : 8);
              hasRenderedContent = true;
            }
            break;
          }

          case 'table': {
            checkPageBreak(36);
            const rows = el.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
              checkPageBreak(22);
              const cells = row.querySelectorAll('th, td');
              if (cells.length === 0) return;

              const colWidth = pageWidth / cells.length;
              const rowY = doc.y;

              const isHeader = rowIndex === 0 && row.querySelector('th') !== null;
              if (isHeader) {
                doc.rect(doc.page.margins.left, rowY, pageWidth, 20).fill('#f1f5f9');
              }

              cells.forEach((cell, cellIndex) => {
                const cellText = cleanText(cell.textContent);
                const cellX = doc.page.margins.left + cellIndex * colWidth + 4;
                doc.font(isHeader ? boldFont : baseFont)
                  .fontSize(9)
                  .fillColor(isHeader ? '#0f172a' : '#334155')
                  .text(cellText, cellX, rowY + 4, { width: colWidth - 8 });
              });

              doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(doc.page.margins.left, rowY, pageWidth, 20).stroke();
              doc.y = rowY + 22;
              hasRenderedContent = true;
            });
            doc.moveDown(0.35);
            break;
          }

          case 'hr': {
            checkPageBreak(12);
            doc.moveDown(0.25);
            doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).stroke();
            doc.moveDown(0.35);
            break;
          }

          default: {
            if (
              (hasClass(el, 'kpi') || hasClass(el, 'badge') || hasClass(el, 'pill') || hasClass(el, 'skill-tag')) &&
              el.children.length === 0
            ) {
              const text = cleanText(el.textContent);
              if (text && text.length < 50) {
                checkPageBreak(20);
                doc.fontSize(8.5);
                const textWidth = doc.widthOfString(text);
                const badgeW = textWidth + 14;
                const badgeH = 16;
                doc.roundedRect(doc.x, doc.y, badgeW, badgeH, 4).fill('#e8f1ff');
                doc.font(boldFont).fontSize(8.5).fillColor('#0068f9').text(text, doc.x + 7, doc.y - badgeH + 4);
                doc.moveDown(0.3);
                hasRenderedContent = true;
                return;
              }
            }

            for (let i = 0; i < el.childNodes.length; i++) {
              renderStandardNode(el.childNodes[i]);
            }
            break;
          }
        }
      }

      // =========================================================================
      // DISPATCH EXECUTION
      // =========================================================================
      if (isResumeStudio) {
        renderResumeStudioLayout();
      } else {
        const body = document.body;
        if (body) {
          for (let i = 0; i < body.childNodes.length; i++) {
            renderStandardNode(body.childNodes[i]);
          }
        }
      }

      // Safety guard: if no content was extracted from HTML, render title and fallback
      if (!hasRenderedContent) {
        doc.font(boldFont).fontSize(16).fillColor('#0f172a').text(pageTitle);
        doc.moveDown(0.5);
        doc.font(baseFont).fontSize(11).fillColor('#64748b').text('Document content generated by Seekr Application Studio.');
      }

      // Add platform watermark page footer on each buffered page
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 24;
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Subtle divider rule across the page footer
        doc.strokeColor('#e2e8f0')
           .lineWidth(0.6)
           .moveTo(doc.page.margins.left, footerY - 5)
           .lineTo(doc.page.width - doc.page.margins.right, footerY - 5)
           .stroke();

        // Platform watermark on bottom left with link
        doc.font('Helvetica').fontSize(8).fillColor('#64748b');
        doc.text(
          'Powered by Seekr https://seekr-v5am.onrender.com/',
          doc.page.margins.left,
          footerY,
          {
            link: 'https://seekr-v5am.onrender.com/',
            lineBreak: false,
          }
        );

        // Page descriptor on bottom right
        doc.text(
          isResumeStudio ? 'Resume' : `Page ${i + 1} of ${totalPages}`,
          doc.page.width - doc.page.margins.right - 100,
          footerY,
          {
            width: 100,
            align: 'right',
            lineBreak: false,
          }
        );

        doc.page.margins.bottom = origBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
