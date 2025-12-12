import Link from 'next/link';
import { LayoutDashboard, Users, Calendar, FileText, Settings, LogOut, HeartPulse } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 flex flex-col transition-all">
                <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
                    <HeartPulse className="w-6 h-6 text-blue-500" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                        CareConnect
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <div className="px-2 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Reception Desk
                    </div>

                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavItem href="/dashboard/appointments" icon={<Calendar size={20} />} label="Appointments" />
                    <NavItem href="/dashboard/patients" icon={<Users size={20} />} label="Patients" />
                    <NavItem href="/dashboard/billing" icon={<FileText size={20} />} label="Billing & Invoices" />

                    <div className="px-2 mt-8 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        System
                    </div>
                    <NavItem href="/dashboard/reports" icon={<FileText size={20} />} label="Reports (Query View)" />
                    <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg w-full transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
                    <h1 className="text-xl font-semibold text-slate-800">Hospital Management Portal</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden sm:block">
                            <div className="font-medium text-slate-900">Receptionist</div>
                            <div className="text-slate-500 text-xs">Admin Access</div>
                        </div>
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                            R
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 transition-all group"
        >
            <span className="group-hover:scale-110 transition-transform">{icon}</span>
            {label}
        </Link>
    );
}
