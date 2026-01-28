import { getAllStaff, getStaffOnLeave } from '@/lib/actions';
import { Users, Building2, Phone, Mail, BadgeCheck, Briefcase, CalendarOff } from 'lucide-react';
import { cookies } from 'next/headers';
import BackButton from '@/components/ui/BackButton';
import StaffLeaveManagementClient from './StaffLeaveManagementClient';

export default async function StaffPage() {
    const staffList = await getAllStaff(); // This now returns active staff
    const staffOnLeave = await getStaffOnLeave();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;
    if (session) {
        try {
            const data = JSON.parse(session.value);
            role = data.role;
        } catch (e) { }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    Staff Management
                </h1>
                <p className="text-slate-500">
                    Manage non-medical staff members, including HR, Receptionists, and Nurses.
                </p>
            </div>

            {role === 'Admin' && (
                <div className="flex justify-end">
                    <a href="/dashboard/staff/new" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                        <Users size={18} /> Add New Staff
                    </a>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Staff Name</th>
                                <th className="px-6 py-4 font-semibold">Role / Job Title</th>
                                <th className="px-6 py-4 font-semibold">Department</th>
                                <th className="px-6 py-4 font-semibold">Contact Info</th>
                                <th className="px-6 py-4 font-semibold text-right">Joining Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {staffList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No active staff members found.
                                    </td>
                                </tr>
                            ) : (
                                staffList.map((staff: any) => (
                                    <tr key={staff.staff_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {staff.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{staff.first_name} {staff.last_name}</div>
                                                <div className="text-xs text-slate-400 font-normal">{staff.shift} Shift</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-slate-400" />
                                                {staff.job_title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {staff.department_name || 'General / Unassigned'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                    {staff.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {staff.phone_number}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                                            {new Date(staff.joining_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff on Leave Table */}
            {staffOnLeave.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarOff className="text-red-500 w-5 h-5" />
                        Staff on Leave
                    </h2>
                    <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-red-50 border-b border-red-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-red-900">Staff Name</th>
                                        <th className="px-6 py-4 font-semibold text-red-900">Role</th>
                                        <th className="px-6 py-4 font-semibold text-red-900">Department</th>
                                        <th className="px-6 py-4 font-semibold text-red-900">From</th>
                                        <th className="px-6 py-4 font-semibold text-red-900">To</th>
                                        <th className="px-6 py-4 font-semibold text-red-900">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffOnLeave.map((s: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {s.staff_name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {s.job_title}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {s.department_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono">
                                                {new Date(s.start_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono">
                                                {new Date(s.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 italic">
                                                {s.reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Leave Management (Admin Only) */}
            {role === 'Admin' && <StaffLeaveManagementClient staff={staffList} />}
        </div>
    );
}
