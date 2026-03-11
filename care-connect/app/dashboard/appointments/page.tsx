import { getAllAppointments, generateInvoice, getAllLabTests } from '@/lib/actions';
import { BadgeCheck, Clock, XCircle, FileText, Stethoscope, Microscope, Beaker } from 'lucide-react';
import { cookies } from 'next/headers';
import BackButton from '@/components/ui/BackButton';
import { SearchInput } from './search';
import Link from 'next/link';

export default async function AppointmentsPage(props: { searchParams: Promise<{ filter?: 'today' | 'upcoming' | 'all', q?: string }> }) {
    const searchParams = await props.searchParams;
    const filter = searchParams?.filter;
    const query = searchParams?.q || '';

    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;
    if (session) {
        try {
            role = JSON.parse(session.value).role;
        } catch (e) { }
    }

    const isPathologist = role === 'Pathologist';

    // If Pathologist, we show Lab Tests instead of Doctor Appointments
    const data = isPathologist ? await getAllLabTests() : await getAllAppointments(filter, query);

    return (
        <div className="space-y-6">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isPathologist ? 'Lab Test Bookings' : (filter === 'today' ? "Today's Appointments" : 'All Appointments')}
                    </h2>
                    <p className="text-slate-500">
                        {isPathologist ? 'Manage laboratory testing schedule and results.' : 'Manage patient visits and generate invoices.'}
                    </p>
                </div>
                {!isPathologist && filter && (
                    <a href="/dashboard/appointments" className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                        <XCircle size={16} /> Clear Filter
                    </a>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <SearchInput />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">{isPathologist ? 'Order ID' : 'ID'}</th>
                                <th className="px-6 py-4 font-semibold">Patient</th>
                                <th className="px-6 py-4 font-semibold">{isPathologist ? 'Test Name' : 'Doctor'}</th>
                                <th className="px-6 py-4 font-semibold">{isPathologist ? 'Scheduled' : 'Date'}</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">{isPathologist ? 'Charge' : 'Invoice'}</th>
                                <th className="px-6 py-4 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(data as any[]).length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No {isPathologist ? 'lab tests' : 'appointments'} found matching this search/filter.
                                    </td>
                                </tr>
                            ) : (data as any[]).map((item: any) => (
                                <tr key={isPathologist ? item.record_id : item.appointment_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">#{isPathologist ? item.record_id : item.appointment_id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.patient_name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {isPathologist ? (
                                            <div className="flex items-center gap-2">
                                                <Beaker size={14} className="text-rose-500" />
                                                {item.test_name}
                                            </div>
                                        ) : item.doctor_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(isPathologist ? item.scheduled_date : item.appointment_date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPathologist ? getLabStatusBadge(item.status) : getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {isPathologist ? `৳${item.cost}` : (item.total_amount ? `৳${item.total_amount}` : '-')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPathologist ? (() => {
                                            const scheduledTime = new Date(item.scheduled_date);
                                            const now = new Date();
                                            const isTooEarly = now < scheduledTime;

                                            if (isTooEarly && item.status !== 'COMPLETED') {
                                                return (
                                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                        <Clock size={12} /> Pending Time
                                                    </span>
                                                );
                                            }

                                            return (
                                                <Link href="/dashboard/lab-management" className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1">
                                                    <Microscope size={14} /> Handle Lab
                                                </Link>
                                            );
                                        })() : (
                                            <div className="flex gap-2">
                                                {role !== 'Admin' && item.status === 'Completed' && !item.total_amount && (
                                                    <form action={async () => {
                                                        'use server';
                                                        await generateInvoice(item.appointment_id);
                                                    }}>
                                                        <button className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                                                            <FileText size={14} /> Generate Bill
                                                        </button>
                                                    </form>
                                                )}

                                                {role === 'Admin' && (item.status === 'Confirmed' || item.status === 'Scheduled') && (() => {
                                                    const apptTime = new Date(item.appointment_date);
                                                    const now = new Date();
                                                    const isTooEarly = now < apptTime;

                                                    if (isTooEarly) {
                                                        return (
                                                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                                <Clock size={12} /> Scheduled Later
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <a href={`/dashboard/consultation/${item.appointment_id}`} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 border border-purple-200 font-medium">
                                                            <Stethoscope size={14} /> Start Consult
                                                        </a>
                                                    );
                                                })()}

                                                {!((role !== 'Admin' && item.status === 'Completed' && !item.total_amount) || (role === 'Admin' && (item.status === 'Confirmed' || item.status === 'Scheduled'))) && (
                                                    <span className="text-xs text-slate-400">No Action</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function getStatusBadge(status: string) {
    if (status === 'Confirmed') return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full"><BadgeCheck size={12} /> Confirmed</span>
    if (status === 'Scheduled') return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full"><Clock size={12} /> Scheduled</span>
    if (status === 'Completed') return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-full"><BadgeCheck size={12} /> Completed</span>
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full"><XCircle size={12} /> {status}</span>
}

function getLabStatusBadge(status: string) {
    if (status === 'COMPLETED') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase"><BadgeCheck size={12} /> Completed</span>;
    if (status === 'SCHEDULED') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] uppercase"><Clock size={12} /> Scheduled</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 font-bold text-[10px] uppercase">{status}</span>;
}
