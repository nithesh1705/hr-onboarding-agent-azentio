import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, FileText } from 'lucide-react';

interface FileViewerProps {
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  fileUrl,
  fileName = 'document.pdf',
  mimeType = 'application/pdf',
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const isImage = fileUrl && (fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || mimeType.startsWith('image/'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex flex-col h-[520px]">
      {/* Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate max-w-xs">
          <FileText className="w-4 h-4 text-brand-400" />
          <span className="truncate font-medium">{fileName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 15))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 ml-1"
            title="Rotate 90 degrees"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 ml-1"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/90">
        {!fileUrl ? (
          <div className="text-center text-slate-500 text-xs">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No document preview available.</p>
          </div>
        ) : isImage ? (
          <img
            src={fileUrl}
            alt="Preview"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            className="max-h-full max-w-full object-contain rounded shadow-lg"
          />
        ) : (
          <iframe
            src={`${fileUrl}#view=FitH`}
            title="PDF Preview"
            className="w-full h-full border-0 rounded"
          />
        )}
      </div>
    </div>
  );
};

