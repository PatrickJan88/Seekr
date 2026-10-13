import { toast } from 'sonner';

export interface PdfExportOptions {
  title?: string;
  filename?: string;
}

/**
 * Opens a PDF preview in a new browser tab from an export button click.
 * Uses window.open() with the URL of the PDF endpoint and sets the target to '_blank'.
 * Most modern browsers display the PDF preview with an integrated toolbar containing a download icon.
 */
export async function triggerDirectPdfExport(
  htmlDocument: string,
  options?: PdfExportOptions
) {
  const title = options?.title || 'Document';
  const filename = options?.filename || 'document.pdf';

  // 1. Generate unique session export ID
  const exportId = `export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const endpointUrl = `/api/export-pdf/${exportId}`;

  // 2. Synchronously open the target tab with the URL of the PDF endpoint
  // Opening the specific endpoint directly avoids 'about:blank' and eliminates blank pages
  let previewTab: Window | null = null;
  try {
    previewTab = window.open(endpointUrl, '_blank');
  } catch (e) {
    console.warn('Direct popup open caught:', e);
  }

  const toastId = toast.loading('Preparing PDF preview...');

  try {
    // 3. Concurrently post the HTML document to prepare the session payload
    const response = await fetch('/api/export-pdf/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: exportId,
        html: htmlDocument,
        title,
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    // 4. Fallback if initial window.open was suppressed by a strict popup blocker
    if (!previewTab || previewTab.closed) {
      const fallbackTab = window.open(endpointUrl, '_blank');
      if (!fallbackTab) {
        const link = document.createElement('a');
        link.href = endpointUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    }

    toast.dismiss(toastId);
    toast.success('PDF preview opened in new tab');
  } catch (err) {
    console.error('PDF export error:', err);
    toast.dismiss(toastId);
    toast.error('Failed to prepare PDF preview. Please check your connection.');
  }
}
