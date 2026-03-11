'use client';

import { addStaff } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Save, Loader2, AlertCircle, Zap } from 'lucide-react';

// ── Role presets: auto-fill job title, salary & shift ────────────────────────
const ROLE_PRESETS: Record<string, { jobTitle: string; salary: number; shift: string; role: string }> = {
    '':                    { jobTitle: '',                     salary: 0,      shift: 'Day',        role: '' },
    'receptionist':        { jobTitle: 'Receptionist',         salary: 22000,  shift: 'Day',        role: 'Staff' },
    'nurse':               { jobTitle: 'Registered Nurse',     salary: 35000,  shift: 'Rotational', role: 'Staff' },
    'senior_nurse':        { jobTitle: 'Senior Nurse',         salary: 48000,  shift: 'Rotational', role: 'Staff' },
    'ward_boy':            { jobTitle: 'Ward Boy',             salary: 15000,  shift: 'Rotational', role: 'Staff' },
    'lab_technician':      { jobTitle: 'Lab Technician',       salary: 28000,  shift: 'Day',        role: 'Staff' },
    'pharmacist':          { jobTitle: 'Pharmacist',           salary: 40000,  shift: 'Day',        role: 'Pharmacist' },
    'pathologist':         { jobTitle: 'Pathologist',          salary: 60000,  shift: 'Day',        role: 'Pathologist' },
    'hr_manager':          { jobTitle: 'HR Manager',           salary: 55000,  shift: 'Day',        role: 'Staff' },
    'accountant':          { jobTitle: 'Accountant',           salary: 45000,  shift: 'Day',        role: 'Staff' },
    'it_support':          { jobTitle: 'IT Support Specialist', salary: 38000, shift: 'Day',        role: 'Staff' },
    'security':            { jobTitle: 'Security Officer',     salary: 18000,  shift: 'Night',      role: 'Staff' },
    'ambulance_driver':    { jobTitle: 'Ambulance Driver',     salary: 20000,  shift: 'Rotational', role: 'Staff' },
    'cleaning_staff':      { jobTitle: 'Cleaning Staff',       salary: 12000,  shift: 'Day',        role: 'Staff' },
    'admin_coordinator':   { jobTitle: 'Admin Coordinator',    salary: 42000,  shift: 'Day',        role: 'Staff' },
};

const PRESET_LABELS: Record<string, string> = {
    '':                    '— Select a Role Preset —',
    'receptionist':        'Receptionist  —  BDT 22,000/mo',
    'nurse':               'Registered Nurse  —  BDT 35,000/mo',
    'senior_nurse':        'Senior Nurse  —  BDT 48,000/mo',
    'ward_boy':            'Ward Boy  —  BDT 15,000/mo',
    'lab_technician':      'Lab Technician  —  BDT 28,000/mo',
    'pharmacist':          'Pharmacist  —  BDT 40,000/mo',
    'pathologist':         'Pathologist  —  BDT 60,000/mo',
    'hr_manager':          'HR Manager  —  BDT 55,000/mo',
    'accountant':          'Accountant  —  BDT 45,000/mo',
    'it_support':          'IT Support  —  BDT 38,000/mo',
    'security':            'Security Officer  —  BDT 18,000/mo',
    'ambulance_driver':    'Ambulance Driver  —  BDT 20,000/mo',
    'cleaning_staff':      'Cleaning Staff  —  BDT 12,000/mo',
    'admin_coordinator':   'Admin Coordinator  —  BDT 42,000/mo',
};

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all';

export default function NewStaffForm({ departments }: { departments: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    // Preset-controlled fields
    const [jobTitle, setJobTitle] = useState('');
    const [salary, setSalary]     = useState('');
    const [shift, setShift]       = useState('Day');
    const [preset, setPreset]     = useState('');

    function applyPreset(key: string) {
        setPreset(key);
        if (!key) return;
        const p = ROLE_PRESETS[key];
        setJobTitle(p.jobTitle);
        setSalary(String(p.salary));
        setShift(p.shift);
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            const res = await addStaff(formData);
            if (res.success) router.push('/dashboard/staff');
            else setError(res.error || 'Failed to add staff');
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Role Preset Banner ───────────────────────────────────────── */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                    <Zap size={16} className="text-indigo-500" />
                    Quick Role Preset
                    <span className="font-normal text-indigo-400 ml-1">— auto-fills job title, salary &amp; shift</span>
                </div>
                <select
                    value={preset}
                    onChange={e => applyPreset(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700"
                >
                    {Object.keys(PRESET_LABELS).map(k => (
                        <option key={k} value={k}>{PRESET_LABELS[k]}</option>
                    ))}
                </select>
                {preset && (
                    <p className="text-xs text-indigo-500">
                        ✓ Preset applied — you can still edit any field below manually.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── Personal Info ──────────────────────────────────────────── */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Personal Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name</label>
                            <input required name="firstName" type="text" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input required name="lastName" type="text" className={inputCls} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input required name="email" type="email" className={inputCls} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <input required name="password" type="password" className={inputCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <input required name="phone" type="tel" placeholder="017XXXXXXXX" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Gender</label>
                            <select name="gender" className={inputCls}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Employment Details ─────────────────────────────────────── */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Employment Details</h3>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Department</label>
                        <select name="deptId" className={inputCls}>
                            <option value="">— Select Department —</option>
                            {departments.map(dept => (
                                <option key={dept.dept_id} value={dept.dept_id}>{dept.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400">Optional for general staff.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Job Title / Role</label>
                        <input
                            required
                            name="jobTitle"
                            type="text"
                            value={jobTitle}
                            onChange={e => setJobTitle(e.target.value)}
                            placeholder="e.g. HR Manager, Receptionist"
                            className={inputCls}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Salary with preset options */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Monthly Salary <span className="text-slate-400 font-normal">(BDT)</span>
                            </label>
                            <input
                                required
                                name="salary"
                                type="number"
                                step="500"
                                min="0"
                                value={salary}
                                onChange={e => setSalary(e.target.value)}
                                placeholder="e.g. 35000"
                                className={inputCls}
                            />
                            {/* Quick salary chips */}
                            <div className="flex flex-wrap gap-1 pt-1">
                                {[15000, 25000, 35000, 50000, 65000].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setSalary(String(amt))}
                                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                                            salary === String(amt)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                                        }`}
                                    >
                                        {(amt / 1000).toFixed(0)}k
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Shift</label>
                            <select
                                name="shift"
                                value={shift}
                                onChange={e => setShift(e.target.value)}
                                className={inputCls}
                            >
                                <option value="Day">☀️ Day</option>
                                <option value="Night">🌙 Night</option>
                                <option value="Rotational">🔄 Rotational</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Joining Date</label>
                        <input
                            required
                            name="joiningDate"
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className={inputCls}
                        />
                    </div>

                    {/* Salary summary card */}
                    {salary && Number(salary) > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                            <p className="font-medium text-slate-700">💰 Salary Summary</p>
                            <div className="flex justify-between">
                                <span>Monthly</span>
                                <span className="font-semibold">BDT {Number(salary).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Annual</span>
                                <span>BDT {(Number(salary) * 12).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                    disabled={loading}
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    Save Staff Member
                </button>
            </div>
        </form>
    );
}
