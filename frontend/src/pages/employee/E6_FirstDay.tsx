import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { Compass, MapPin, Clock, Calendar, CheckSquare, Download, Phone, User } from 'lucide-react';

export const FirstDay: React.FC = () => {
  const [joiner, setJoiner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/joiners/me')
      .then((data) => setJoiner(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const locationData: Record<string, any> = {
    Bengaluru: {
      address: 'Tower B, 5th Floor, Global Technology Park, Bellandur Outer Ring Road, Bengaluru, Karnataka 560103',
      contact: 'Anand Kumar (Facilities Lead)',
      phone: '+91 80 4912 3000',
      arrivalSteps: 'Collect visitor badge at Ground Floor Security Gate 2 by presenting Offer Letter PDF. Head to 5th floor Cafeteria for Welcome Breakfast.',
      itHandover: 'IT Helpdesk Bay 3 at 11:30 AM.'
    },
    Mumbai: {
      address: 'Floor 12, One World Center, Tower 2, Lower Parel (West), Mumbai, Maharashtra 400013',
      contact: 'Priya Deshmukh (Office Admin)',
      phone: '+91 22 6123 4567',
      arrivalSteps: 'Visitor turnstile access on West Wing. Assemble in the Sapphire Boardroom at 09:45 AM.',
      itHandover: 'Desk delivery by IT Operations at 02:00 PM.'
    },
    Delhi: {
      address: '8th Floor, DLF Cyber City, Building 10, DLF Phase 2, Gurugram, Haryana 122002',
      contact: 'Vikram Malhotra (Facilities Lead)',
      phone: '+91 124 456 7890',
      arrivalSteps: 'Tower reception security verification with government photo ID. Meet in the North Hub training room.',
      itHandover: 'IT desk setup session at 11:30 AM.'
    }
  };

  const locInfo = joiner && locationData[joiner.location] ? locationData[joiner.location] : locationData['Bengaluru'];

  const schedule = [
    { time: '09:30 AM - 10:00 AM', title: 'Reception, Security Badging & Welcome Kit', desc: 'Present original ID documents at reception to obtain RFID building pass.' },
    { time: '10:00 AM - 11:30 AM', title: 'Executive Welcome Breakfast & Culture Briefing', desc: 'Meet your joining cohort and hear from company leadership.' },
    { time: '11:30 AM - 01:00 PM', title: 'IT Setup & Laptop Handover', desc: `${locInfo.itHandover} Configure Google Workspace SSO and security key.` },
    { time: '01:00 PM - 02:00 PM', title: 'Welcome Lunch with Team', desc: 'Enjoy lunch with your reporting manager and onboarding buddy.' },
    { time: '02:00 PM - 04:00 PM', title: 'HR Benefits Enrollment & Q&A', desc: 'Medical insurance nomination, provident fund setup, and policy orientation.' }
  ];

  const handleDownloadCalendar = () => {
    if (!joiner) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HR Onboarding//First Day//EN
BEGIN:VEVENT
SUMMARY:First Day at Work - ${joiner.role}
DESCRIPTION:Report at 09:30 AM. Bring original government ID and certificates.
LOCATION:${locInfo.address}
DTSTART:${joiner.joining_date.replace(/-/g, '')}T040000Z
DTEND:${joiner.joining_date.replace(/-/g, '')}T120000Z
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'First_Day_Orientation.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            <span>First-Day Office Guide ({joiner?.location || 'Bengaluru'})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sourced strictly from policy <strong>HR-DAY1-001</strong> for your designated joining location.
          </p>
        </div>

        <button
          onClick={handleDownloadCalendar}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          <span>Add to Calendar (.ics)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Location & Reporting Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Campus Address</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {locInfo.address}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Reporting Time:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">09:30 AM sharp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dress Code:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Smart Business Casual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Local Contact:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{locInfo.contact}</span>
              </div>
            </div>
          </div>

          {/* What to Bring */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>What to Bring on Day One</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>Original physical Government ID (PAN/Aadhaar/Passport) for security badging.</li>
              <li>Original Degree Certificate or provisional passing certificates.</li>
              <li>Offer Letter digital or printed PDF.</li>
              <li>Voided cheque or bank details for direct payroll setup.</li>
            </ul>
          </div>
        </div>

        {/* Right: Day One Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Day One Orientation Itinerary</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {joiner?.joining_date}
            </span>
          </div>

          <div className="space-y-4">
            {schedule.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start text-xs">
                <div className="w-36 font-mono font-semibold text-brand-600 dark:text-brand-400 shrink-0 pt-0.5">
                  {item.time}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-slate-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

