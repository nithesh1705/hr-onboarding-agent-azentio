import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { DocumentCard, DocumentItem } from '../../components/DocumentCard';
import { FileText, Info, ShieldCheck, AlertCircle } from 'lucide-react';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [joinerId, setJoinerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const joiner = await apiRequest('/joiners/me');
      setJoinerId(joiner.id);
      const docs = await apiRequest(`/joiners/${joiner.id}/documents`);
      setDocuments(docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-600" />
          <span>My Required Documents</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload statutory identification, address proofs, and qualification certificates.
        </p>
      </div>

      {/* Upload Tips & Legibility Guidelines */}
      <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-brand-900 dark:text-brand-200">
          <span className="font-bold">Guidelines for Fast Approval:</span>
          <ul className="list-disc list-inside space-y-0.5 text-brand-800 dark:text-brand-300">
            <li>Ensure all 4 corners of the document are visible without glare or shadow.</li>
            <li>Accepted formats: <strong>PDF, JPG, PNG</strong> (maximum file size <strong>10 MB</strong>).</li>
            <li>Full Legal Name and Date of Birth must match your official employment record.</li>
            <li>Government IDs must remain valid past your official joining date.</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              joinerId={joinerId}
              onUploaded={fetchDocs}
            />
          ))}
        </div>
      )}
    </div>
  );
};

