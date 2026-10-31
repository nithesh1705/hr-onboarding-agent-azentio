import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Users, Search, Filter, Plus, ArrowRight, Download, Send } from 'lucide-react';

export const JoinersList: React.FC = () => {
  const [joiners, setJoiners] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [location, setLocation] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchJoiners = async () => {
    try {
      const data = await apiRequest('/joiners');
      setJoiners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoiners();
  }, []);

  const filtered = joiners.filter((j) => {
    const s = search.toLowerCase();
    const matchSearch = j.full_name.toLowerCase().includes(s) || j.email.toLowerCase().includes(s) || j.role.toLowerCase().includes(s);
    const matchDept = department === 'All' || j.department === department;
    const matchLoc = location === 'All' || j.location === location;
    return matchSearch && matchDept && matchLoc;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>All Incoming Joiners</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage onboarding cohorts, view individual progress checklists, and handle rescheduling.
          </p>
        </div>

        <Link
          to="/hr/add-joiner"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Joiner</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Analytics">Analytics</option>
              <option value="Finance">Finance</option>
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Role & Grade</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Readiness</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <Link
                      to={`/hr/joiners/${j.id}`}
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline block"
                    >
                      {j.full_name}
                    </Link>
                    <span className="text-slate-400 text-[11px]">{j.email}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {j.role} ({j.grade})
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {j.department}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {j.location}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {j.joining_date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {j.readiness_score}%
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={j.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/hr/joiners/${j.id}`}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

