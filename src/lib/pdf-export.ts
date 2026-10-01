import { toast } from 'sonner';

/**
 * Triggers the browser's native print preview dialog for the provided HTML document.
 * Opens the print preview and automatically closes the temporary window upon completion or dismissal.
 */
export function triggerDirectPdfExport(htmlDocument: string) {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups in your browser to print or export PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlDocument);
    printWindow.document.close();
  } catch (err) {
    console.error('Print preview error:', err);
    toast.error('Unable to open print preview. Please check browser permissions.');
  }
}
