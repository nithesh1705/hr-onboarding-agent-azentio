import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, ShieldCheck, Save, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const [joiner, setJoiner] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const fetchData = async () => {
    try {
      const data = await apiRequest('/joiners/me');
      setJoiner(data);
      setPhone(data.phone || '');
      setEmergencyContact(data.emergency_contact || '');
      setPreferredName(data.preferred_name || '');
      setAddress(data.address || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await apiRequest('/joiners/me/contact', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          emergency_contact: emergencyContact,
          preferred_name: preferredName,
          address,
        }),
      });
      setSuccessMsg('Contact information updated successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const handleReportIssue = async () => {
    if (!reportText.trim()) return;
    try {
      await apiRequest('/followups', {
        method: 'POST',
        body: JSON.stringify({
          joiner_id: joiner.id,
          source: 'profile_report',
          text: `Employee reported profile discrepancy: ${reportText}`,
        }),
      });
      alert('Issue reported to HR Operations. A team member will verify and adjust your record.');
      setReportModalOpen(false);
      setReportText('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-brand-600" />
          <span>My Onboarding Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review legal employment details and update personal emergency contacts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job & Offer Record (Read Only) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Employment Details (Locked)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Legal Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {joiner.full_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Designated Role & Grade</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {joiner.role} ({joiner.grade})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department</span>
                <span className="text-slate-800 dark:text-slate-200">{joiner.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className="text-slate-800 dark:text-slate-200">{joiner.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Reporting Manager</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {joiner.manager_name} ({joiner.manager_email})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Joining Date</span>
                <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                  {joiner.joining_date}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Notice a mistake in your role or date? Report to HR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Editable Contact Details Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Personal & Emergency Contact Information
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {joiner.completeness_pct}% Complete
            </span>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Emergency Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Ramesh Rao (Father) - +91 98450 67890"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Preferred First Name (for Badge & Slack)
                </label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Asha"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Corporate Email
                </label>
                <input
                  type="text"
                  disabled
                  value={joiner.email}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Current Residential Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat 402, Sunshine Apts, Indiranagar, Bengaluru 560038"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Discrepancy Reporting Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Report Incorrect Detail to HR
            </h3>
            <p className="text-slate-500">
              Please specify the discrepancy (e.g. spelling error in name, revised joining date agreed with manager).
            </p>
            <textarea
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Explain the correction needed..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                className="px-4 py-1.5 rounded-lg font-bold text-white bg-brand-600 hover:bg-brand-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

