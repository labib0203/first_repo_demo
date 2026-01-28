'use client';

import { useState } from 'react';
import { addStaffLeave } from '@/lib/actions';
import { CalendarOff, CheckCircle, AlertCircle, User } from 'lucide-react';

export default function StaffLeaveManagementClient({ staff }: { staff: any[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setMessage(null);

        const res = await addStaffLeave(formData);
        setIsSubmitting(false);

        if (res.success) {
            setMessage({ type: 'success', text: res.message });
            (document.getElementById('staffLeaveForm') as HTMLFormElement).reset();
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to add leave.' });
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarOff className="text-red-500" />
                Manage Staff Leaves
            </h3>
            <p className="text-slate-500 text-sm mb-6">
                Mark a staff member as unavailable for a specific period.
            </p>

            <form id="staffLeaveForm" action={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Select Staff</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <select name="staffId" required className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Choose...</option>
                            {staff.map((s: any) => (
                                <option key={s.staff_id} value={s.staff_id}>
                                    {s.first_name} {s.last_name} ({s.job_title})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Reason</label>
                    <input
                        type="text"
                        name="reason"
                        placeholder="e.g. Sick Leave"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors h-[38px]"
                >
                    {isSubmitting ? 'Processing...' : 'Mark Leave'}
                </button>
            </form>

            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
