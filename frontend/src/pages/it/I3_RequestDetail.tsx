import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { ArrowLeft, Laptop, ShieldCheck, Mail, Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const I3_RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hardwareAssetTag, setHardwareAssetTag] = useState('');
  const [hardwareSerial, setHardwareSerial] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [courierTracking, setCourierTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any>(`/provisioning/requests/${id}`);
      setReq(data);
      setHardwareAssetTag(data.hardware_asset_tag || '');
      setHardwareSerial(data.hardware_serial || '');
      setCorporateEmail(data.corporate_email || '');
      setCourierTracking(data.courier_tracking || '');
      setNotes(data.notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (newStatus?: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        hardware_asset_tag: hardwareAssetTag,
        hardware_serial: hardwareSerial,
        corporate_email: corporateEmail,
        courier_tracking: courierTracking,
        notes: notes,
      };
      if (newStatus) {
        payload.status = newStatus;
      }
      const updated = await apiClient.patch<any>(`/provisioning/requests/${id}`, payload);
      setReq(updated);
      setSuccess('Request updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading provisioning request...</div>;
  }
  if (!req) {
    return <div className="p-8 text-center text-rose-500">Request not found.</div>;
  }

  const isBlocked = req.status === 'BLOCKED_BY_PREJOIN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/it/requests')}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              IT Request: {req.joiner_name}
            </h1>
            <StatusBadge status={req.status} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {req.role_title} • {req.department} • Joining {req.joining_date}
          </p>
        </div>
      </div>

      {isBlocked && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Upstream Blocker: Pre-joining verification pending
            </div>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Policy IT-PRV-001 requires HR pre-joining document approval before IT hardware dispatch and corporate account creation. The candidate's readiness is currently at {req.readiness_percentage}%.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Plan */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-500" />
              Hardware & Access Bundle
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Standard Hardware Profile</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {req.laptop_tier || 'MacBook Pro 14" M3 / 32GB'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Access Bundle</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {req.access_tier || 'Standard Dev Bundle (GitHub, AWS Dev, Slack)'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Fulfillment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Hardware Asset Tag
                  </label>
                  <input
                    type="text"
                    value={hardwareAssetTag}
                    onChange={(e) => setHardwareAssetTag(e.target.value)}
                    placeholder="e.g. AST-MAC-2026-091"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={hardwareSerial}
                    onChange={(e) => setHardwareSerial(e.target.value)}
                    placeholder="e.g. C02G90XXMD6M"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    placeholder="e.g. firstname.lastname@company.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Courier / Tracking ID
                  </label>
                  <input
                    type="text"
                    value={courierTracking}
                    onChange={(e) => setCourierTracking(e.target.value)}
                    placeholder="e.g. BLUEDART-9842104"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes on packaging, image version, security keys, etc."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleUpdate()}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              {req.status === 'READY_TO_PREPARE' && (
                <button
                  onClick={() => handleUpdate('IN_PROGRESS')}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                >
                  Mark In Progress
                </button>
              )}

              {req.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdate('DISPATCHED')}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Mark Dispatched
                </button>
              )}

              {req.status === 'DISPATCHED' && (
                <button
                  onClick={() => handleUpdate('DELIVERED')}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Delivered
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Candidate & Policy Context */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Joiner Info</h3>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-slate-400 block">Personal Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{req.personal_email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Location:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{req.location || 'Remote'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Joining Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{req.joining_date}</span>
              </div>
              <div className="pt-2">
                <Link
                  to={`/hr/joiners/${req.joiner_id}`}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Full Joiner Profile →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Policy Guidance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard lead time is <strong>5 business days</strong> prior to Day 1. Hardware must be enrolled in MDM (Jamf/Intune) before shipping. Tracking numbers must be added here to trigger candidate shipment notification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

