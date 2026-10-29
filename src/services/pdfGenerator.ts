import PDFDocument from 'pdfkit';
import { JSDOM } from 'jsdom';

interface GeneratePdfOptions {
  title?: string;
  filename?: string;
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
      const combinedStyle = `${styleTagContent} ${bodyStyleAttr} ${dataStyleAttr} ${html}`.toLowerCase();

      const isStudioA4 = document.querySelector('.a4-page-sheet') !== null || html.includes('a4-page-sheet');

      // Style preset detection (Classic, Executive, Academic use serif typography; Modern uses sans-serif)
      const isSerif =
        dataStyleAttr === 'classic' ||
        dataStyleAttr === 'executive' ||
        dataStyleAttr === 'academic' ||
        combinedStyle.includes('times new roman') ||
        combinedStyle.includes('georgia') ||
        combinedStyle.includes('computer modern') ||
        combinedStyle.includes('font-serif');

      const baseFont = isSerif ? 'Times-Roman' : 'Helvetica';
      const boldFont = isSerif ? 'Times-Bold' : 'Helvetica-Bold';
      const italicFont = isSerif ? 'Times-Italic' : 'Helvetica-Oblique';

      // Remove non-content elements and existing HTML-level print footers
      document.querySelectorAll('script, style, noscript, .page-footer-print').forEach(el => el.remove());

      // 22mm A4 Geometry: 1mm = 2.83465pt
      // Margins: Left 22mm (62.4pt), Right 22mm (62.4pt), Top 24mm (68pt), Bottom 20mm (56pt)
      const docMargins = isStudioA4
        ? { top: 68, bottom: 56, left: 62.4, right: 62.4 }
        : { top: 36, bottom: 45, left: 36, right: 36 };

      // Create PDFKit document
      const doc = new PDFDocument({
        size: 'A4',
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
        return text.replace(/\s+/g, ' ').trim();
      }

      function hasClass(el: HTMLElement, targetClass: string): boolean {
        const classes = (el.className || '').split(/\s+/);
        return classes.includes(targetClass);
      }

      function renderNode(node: Node) {
        if (node.nodeType === 3) {
          // Text node
          const text = cleanText(node.textContent);
          if (text) {
            checkPageBreak(16);
            doc.font(baseFont)
               .fontSize(isStudioA4 ? 11 : 9.5)
               .fillColor('#1e293b')
               .text(text, { lineGap: isStudioA4 ? 4.5 : 2.5 });
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

        // Explicit multi-page break boundary (e.g. .a4-page-sheet or page-card or page-break-after/before)
        if (
          hasRenderedContent &&
          (className.includes('a4-page-sheet') || className.includes('page-card') || style.includes('page-break-before')) &&
          doc.y > doc.page.margins.top + 30
        ) {
          doc.addPage();
        }

        // Custom styled title / resume header classes
        if (hasClass(el, 'story-title-print') || (hasClass(el, 'name') && tag === 'div')) {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(35);
            doc.moveDown(0.3);
            doc.font(boldFont).fontSize(19).fillColor('#0f172a').text(text);
            doc.moveDown(0.2);
            doc.strokeColor('#0068f9').lineWidth(1.5).moveTo(doc.x, doc.y).lineTo(doc.x + Math.min(pageWidth, 160), doc.y).stroke();
            doc.moveDown(0.4);
            hasRenderedContent = true;
            return;
          }
        }

        if (hasClass(el, 'section-title') || hasClass(el, 'main-h')) {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(28);
            doc.moveDown(0.4);
            doc.font(boldFont).fontSize(13).fillColor('#0f172a').text(text);
            doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(doc.x, doc.y + 2).lineTo(doc.x + pageWidth, doc.y + 2).stroke();
            doc.moveDown(0.35);
            hasRenderedContent = true;
            return;
          }
        }

        if (hasClass(el, 'section-h')) {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(24);
            doc.moveDown(0.3);
            doc.font(boldFont).fontSize(11.5).fillColor('#1e293b').text(text);
            doc.moveDown(0.2);
            hasRenderedContent = true;
            return;
          }
        }

        if (hasClass(el, 'title') && tag === 'div') {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(18);
            doc.font(boldFont).fontSize(11.5).fillColor('#0068f9').text(text);
            doc.moveDown(0.25);
            hasRenderedContent = true;
            return;
          }
        }

        if (hasClass(el, 'exp-company') || hasClass(el, 'meta')) {
          const text = cleanText(el.textContent);
          if (text) {
            checkPageBreak(16);
            doc.font(italicFont).fontSize(9.5).fillColor('#475569').text(text);
            doc.moveDown(0.2);
            hasRenderedContent = true;
            return;
          }
        }

        // Handle specific HTML tags
        switch (tag) {
          case 'h1': {
            checkPageBreak(40);
            const text = cleanText(el.textContent);
            if (text) {
              doc.moveDown(0.35);
              doc.font(boldFont).fontSize(isStudioA4 ? 19 : 18).fillColor('#0f172a').text(text);
              doc.moveDown(0.2);
              doc.strokeColor('#0068f9').lineWidth(1.5).moveTo(doc.x, doc.y).lineTo(doc.x + Math.min(pageWidth, 160), doc.y).stroke();
              doc.moveDown(0.4);
              hasRenderedContent = true;
            }
            break;
          }

          case 'h2': {
            checkPageBreak(32);
            const text = cleanText(el.textContent);
            if (text) {
              doc.moveDown(0.4);
              doc.font(boldFont).fontSize(isStudioA4 ? 14 : 13).fillColor('#0f172a').text(text);
              doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(doc.x, doc.y + 2).lineTo(doc.x + pageWidth, doc.y + 2).stroke();
              doc.moveDown(0.35);
              hasRenderedContent = true;
            }
            break;
          }

          case 'h3': {
            checkPageBreak(28);
            const text = cleanText(el.textContent);
            if (text) {
              doc.moveDown(0.35);
              doc.font(boldFont).fontSize(isStudioA4 ? 12 : 11).fillColor('#1e293b').text(text);
              doc.moveDown(0.2);
              hasRenderedContent = true;
            }
            break;
          }

          case 'h4':
          case 'h5':
          case 'h6': {
            checkPageBreak(22);
            const text = cleanText(el.textContent);
            if (text) {
              doc.moveDown(0.25);
              doc.font(boldFont).fontSize(isStudioA4 ? 11 : 10).fillColor('#334155').text(text);
              doc.moveDown(0.2);
              hasRenderedContent = true;
            }
            break;
          }

          case 'p': {
            checkPageBreak(22);
            // Handle paragraphs that may have <br> elements
            const lines = el.innerHTML.split(/<br\s*\/?>/i);
            lines.forEach((lineHtml) => {
              // Strip any inner html tags to get text
              const tempDom = new JSDOM(`<body>${lineHtml}</body>`);
              const lineText = cleanText(tempDom.window.document.body.textContent);
              if (lineText) {
                checkPageBreak(16);
                doc.font(baseFont)
                   .fontSize(isStudioA4 ? 11 : 9.5)
                   .fillColor('#1e293b')
                   .text(lineText, {
                     lineGap: isStudioA4 ? 4.5 : 3,
                     width: pageWidth,
                   });
                hasRenderedContent = true;
              }
            });
            doc.moveDown(isStudioA4 ? 0.85 : 0.35);
            break;
          }

          case 'br': {
            doc.moveDown(isStudioA4 ? 0.6 : 0.35);
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
                const prevX = doc.x;
                doc.font(boldFont).fontSize(isStudioA4 ? 11 : 9.5).fillColor('#0068f9').text(bullet, prevX + 6, doc.y, { continued: true });
                doc.font(baseFont).fontSize(isStudioA4 ? 11 : 9.5).fillColor('#1e293b').text(liText, {
                  lineGap: isStudioA4 ? 4.5 : 2.5,
                  width: pageWidth - 20,
                });
                doc.x = prevX;
                doc.moveDown(isStudioA4 ? 0.3 : 0.2);
                hasRenderedContent = true;
              }
            });
            doc.moveDown(isStudioA4 ? 0.5 : 0.25);
            break;
          }

          case 'blockquote': {
            checkPageBreak(36);
            const text = cleanText(el.textContent);
            if (text) {
              const startY = doc.y;
              const quoteX = doc.x + 14;
              doc.font(italicFont).fontSize(isStudioA4 ? 11 : 9.5).fillColor('#1e293b').text(text, quoteX, startY + 4, {
                width: pageWidth - 24,
                lineGap: isStudioA4 ? 4.5 : 3,
              });
              const endY = doc.y + 4;
              doc.strokeColor('#0068f9').lineWidth(3).moveTo(doc.x, startY).lineTo(doc.x, endY).stroke();
              doc.x = doc.page.margins.left;
              doc.y = endY + (isStudioA4 ? 8 : 6);
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
            doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(doc.x, doc.y).lineTo(doc.x + pageWidth, doc.y).stroke();
            doc.moveDown(0.35);
            break;
          }

          default: {
            // Pill badges or skill tags (small inline labels)
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

            // Recursively process child nodes
            for (let i = 0; i < el.childNodes.length; i++) {
              renderNode(el.childNodes[i]);
            }
            break;
          }
        }
      }

      // Render the body content
      const body = document.body;
      if (body) {
        for (let i = 0; i < body.childNodes.length; i++) {
          renderNode(body.childNodes[i]);
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
        const footerY = doc.page.height - 28;
        const origBottom = doc.page.margins.bottom;
        // Temporarily clear bottom margin so text positioned at bottom never triggers a page break
        doc.page.margins.bottom = 0;

        // Subtle divider rule across the page footer
        doc.strokeColor('#e2e8f0')
           .lineWidth(0.6)
           .moveTo(doc.page.margins.left, footerY - 6)
           .lineTo(doc.page.width - doc.page.margins.right, footerY - 6)
           .stroke();

        // Platform watermark on bottom left with link
        doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
        doc.text(
          'Powered by Seekr https://seekr-v5am.onrender.com/',
          doc.page.margins.left,
          footerY,
          {
            link: 'https://seekr-v5am.onrender.com/',
            lineBreak: false,
          }
        );

        // Page number on bottom right
        doc.text(
          `Page ${i + 1} of ${totalPages}`,
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
