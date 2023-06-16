// // This is a wrapper above React-pdf made to lazy-load the library and handle specific worker logic in a central place
import { Document, Page, pdfjs } from 'react-pdf';

if (typeof window === 'object') {
  // don't do this when loading server-side with nextjs
  try {
    const pdfjsWorkerUrl = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url);
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl.toString();
  } catch {
    // this doesn't work in a test environment when Jest is running it, in this case do nothing
  }
}

export { Document, Page };
