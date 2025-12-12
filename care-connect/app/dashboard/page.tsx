import { getDashboardStats, getRecentAppointments } from '@/lib/actions';
import { Users, Calendar, DollarSign, Activity, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    // Add try/catch to handle DB connection errors gracefully during first run
    let stats = { totalPatients: 0, todayAppointments: 0, activeDoctors: 0, pendingRevenue: 0 };
    let recentAppointments: any[] = [];
    let error = null;

    try {
        stats = await getDashboardStats();
        recentAppointments = await getRecentAppointments();
    } catch (e: any) {
        error = e.message;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <h3 className="font-bold text-lg mb-2">Database Connection Failed</h3>
                <p>Please ensure creating the database and configuring .env.local correctly.</p>
                <pre className="mt-4 bg-white p-4 rounded text-sm overflow-x-auto">{error}</pre>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                    <p className="text-slate-500">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/appointments/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        <Plus size={18} /> New Appointment
                    </Link>
                    <Link href="/dashboard/patients/new" className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <Users size={18} /> Register Patient
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value={stats.totalPatients} icon={<Users className="text-blue-600" />} color="blue" />
                <StatCard title="Today's Appointments" value={stats.todayAppointments} icon={<Calendar className="text-purple-600" />} color="purple" />
                <StatCard title="Active Doctors" value={stats.activeDoctors} icon={<Activity className="text-emerald-600" />} color="emerald" />
                <StatCard title="Pending Revenue" value={`৳${stats.pendingRevenue}`} icon={<DollarSign className="text-orange-600" />} color="orange" />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Recent Appointments</h3>
                    <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Patient</th>
                                <th className="px-6 py-4 font-semibold">Doctor</th>
                                <th className="px-6 py-4 font-semibold">Date & Time</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No appointments found.</td>
                                </tr>
                            ) : recentAppointments.map((appt: any) => (
                                <tr key={appt.appointment_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{appt.patient_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{appt.doctor_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(appt.appointment_date).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${appt.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-slate-100 text-slate-800'}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${appt.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {appt.payment_status || 'Unbilled'}
                                        </span>
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

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
                </div>
                <div className={`p-3 bg-${color}-50 rounded-lg border border-${color}-100`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
