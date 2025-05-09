"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PDFAnnotator from './components/PDFAnnotator';
import { PDFDocument, rgb } from 'pdf-lib';

export default function PDFTestPage() {
  const [error, setError] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const router = useRouter();

  const handleSaveAnnotations = (newAnnotations) => {
    setAnnotations(newAnnotations);
  };

  const handleExport = async () => {
    try {
      const pdfViewer = document.querySelector('.rpv-core__page-layer');
      const docWidth = pdfViewer?.offsetWidth ?? 595;  // A4 size
      const docHeight = pdfViewer?.offsetHeight ?? 842;

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      // const page = pdfDoc.addPage([docWidth, docHeight]);


      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
      const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
      // copiedPages.forEach(page => pdfDoc.addPage(page));
      const page = pdfDoc.addPage(copiedPages[0]);


      // Add annotations to the PDF
      annotations.forEach(annotation => {
        let { x, y, width, height, description, zoom } = annotation;

        x = (x - 44) * 100 / zoom;
        y = (y - 40) * 100 / zoom;
        width = width * 100 / zoom;
        height = height * 100 / zoom;

        // Draw rectangle
        page.drawRectangle({
          x,
          y: 842 - y - height, // Flip y-coordinate since PDF coordinates start from bottom
          width,
          height,
          borderColor: rgb(0, 0, 1), // Blue border
          borderWidth: 2,
        });

        // Add description text
        page.drawText(description, {
          x: x + 5,
          y: 842 - y - height - 15, // Position text above the rectangle
          size: 12,
          color: rgb(0, 0, 1), // Blue text
        });
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();

      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'annotated-pdf.pdf';
      link.click();
      URL.revokeObjectURL(url);

      // Also export annotations as JSON
      const dataStr = JSON.stringify(annotations, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const jsonLink = document.createElement('a');
      jsonLink.href = dataUri;
      jsonLink.download = 'pdf-annotations.json';
      jsonLink.click();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export PDF and annotations');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PDF Annotation Tool</h1>
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="pdf-upload">
            Upload PDF
          </label>
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const fileUrl = URL.createObjectURL(file);
                setAnnotations([]);
                setPdfUrl(fileUrl);

                setError(null);
              }
            }}
          />
        </div>

        {pdfUrl && (
          <>
            <PDFAnnotator
              pdfUrl={pdfUrl}
              onSave={handleSaveAnnotations}
            />
            <div className="mt-6">
              <button
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExport}
                disabled={annotations.length === 0}
              >
                Export PDF and Annotations
              </button>
              <button
                className="px-4 py-2 ml-4 font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}