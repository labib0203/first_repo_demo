import pool from '@/lib/db';
import { Database, Search, FileText, TrendingUp, Users, Activity, ChevronRight, Info } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RevenueReporter from './revenue-reporter';
import BackButton from '@/components/ui/BackButton';
import Link from 'next/link';

const REPORTS = [
    {
        id: 1,
        title: "High Value Doctors",
        description: "Doctors charging above average consultation fee",
        details: "Uses nested subquery for average calculation",
        icon: <Users className="w-5 h-5 text-blue-500" />,
        color: "bg-blue-50 border-blue-100",
        sql: `SELECT 
    CONCAT(d_prof.first_name, ' ', d_prof.last_name) AS doctor_name, 
    d.consultation_fee
FROM doctors d
JOIN profiles d_prof ON d.user_id = d_prof.user_id
WHERE d.consultation_fee > (SELECT AVG(consultation_fee) FROM doctors)`
    },
    {
        id: 2,
        title: "Revenue by Department",
        description: "Rollup aggregation of revenue by department",
        details: "Includes Admissions, Lab, Pharmacy & Grand Total with ROLLUP",
        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        color: "bg-emerald-50 border-emerald-100",
        sql: `SELECT 
    COALESCE(department, 'GRAND TOTAL') AS department,
    SUM(revenue) AS total_revenue
FROM (
    -- 1. Consultation Revenue (Appointment Invoices)
    SELECT 
        dept.name AS department,
        i.net_amount AS revenue
    FROM invoices i
    JOIN appointments a ON i.appointment_id = a.appointment_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN departments dept ON d.dept_id = dept.dept_id
    WHERE i.status = 'Paid'

    UNION ALL

    -- 2. Lab Test Revenue
    SELECT 
        'Laboratory & Diagnostics' AS department,
        i.net_amount AS revenue
    FROM invoices i
    WHERE i.test_record_id IS NOT NULL 
    AND i.status = 'Paid'

    UNION ALL

    -- 3. Pharmacy Revenue
    SELECT 
        'Pharmacy' AS department,
        i.net_amount AS revenue
    FROM invoices i
    WHERE i.pharmacy_order_id IS NOT NULL
    AND i.status = 'Paid'

    UNION ALL

    -- 4. Pharmacy Expenses (Restock Cost — deducted)
    SELECT
        'Pharmacy' AS department,
        -(amount) AS revenue
    FROM hospital_expenses
    WHERE category = 'Pharmacy_Restock'

    UNION ALL

    -- 5. Inpatient & Rooms (Admission / Room Charges)
    SELECT
        'Inpatient & Rooms' AS department,
        total_cost AS revenue
    FROM admissions
    WHERE status = 'Discharged'
    AND total_cost > 0

) AS combined_revenue
GROUP BY department WITH ROLLUP`
    },
    {
        id: 3,
        title: "Patient Spending Rank",
        description: "Ranking patients by total spend across all services",
        details: "Analyzed using Window Functions (RANK)",
        icon: <Activity className="w-5 h-5 text-purple-500" />,
        color: "bg-purple-50 border-purple-100",
        sql: `SELECT 
    CONCAT(prof.first_name, ' ', prof.last_name) AS patient_name,
    SUM(i.net_amount) AS total_spent,
    RANK() OVER (ORDER BY SUM(i.net_amount) DESC) AS spending_rank
FROM invoices i
LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
LEFT JOIN patient_tests pt ON i.test_record_id = pt.record_id
LEFT JOIN pharmacy_orders po ON i.pharmacy_order_id = po.order_id
JOIN patients pat ON pat.patient_id = COALESCE(a.patient_id, pt.patient_id, po.patient_id)
JOIN profiles prof ON pat.user_id = prof.user_id
WHERE i.status = 'Paid'
GROUP BY pat.patient_id, prof.first_name, prof.last_name`
    },
    {
        id: 4,
        title: "Financial Performance (View)",
        description: "Yearly, Monthly, and Weekly Revenue snapshots",
        details: "Pre-calculated table for high performance",
        icon: <FileText className="w-5 h-5 text-amber-500" />,
        color: "bg-amber-50 border-amber-100",
        sql: `SELECT 
    report_type AS Report_Type,
    period_label AS Period,
    total_revenue AS Revenue,
    DATE_FORMAT(last_updated, '%M %d, %Y %h:%i %p') AS Last_Updated
FROM financial_reports
ORDER BY 
    FIELD(report_type, 'Yearly', 'Monthly', 'Weekly'), 
    period_label DESC`
    }
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;
    if (session) {
        try {
            const data = JSON.parse(session.value);
            role = data.role;
        } catch (e) { }
    }

    if (role !== 'Admin' && role !== 'Pathologist') {
        redirect('/dashboard');
    }

    const activeReport = REPORTS.find(r => r.id.toString() === params.q);
    let results: any[] = [];
    let error = null;

    if (activeReport) {
        try {
            const [rows] = await pool.query(activeReport.sql);
            results = rows as any[];
        } catch (e: any) {
            error = e.message;
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <BackButton href="/dashboard" label="Back to Dashboard" />
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-4">Intelligence Center</h2>
                    <p className="text-slate-500">Actionable insights generated from complex data analysis.</p>
                </div>
                <div className="hidden md:block">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Live Database View
                    </div>
                </div>
            </div>

            <RevenueReporter />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Reports Menu */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 px-1 text-slate-400">
                        <Database className="w-4 h-4" />
                        <h3 className="font-semibold uppercase text-[10px] tracking-widest pb-1 border-b border-slate-100 flex-1">Analytics Library</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {REPORTS.map(r => (
                            <Link
                                key={r.id}
                                href={`/dashboard/reports?q=${r.id}`}
                                className={`group flex flex-col p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                    ${activeReport?.id === r.id
                                        ? `${r.color} ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-[1.02]`
                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform`}>
                                        {r.icon}
                                    </div>
                                    <ChevronRight size={16} className={`transition-all ${activeReport?.id === r.id ? 'text-blue-500 translate-x-0 opacity-100' : 'text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </div>
                                <h4 className={`font-bold text-sm mb-1 ${activeReport?.id === r.id ? 'text-slate-900' : 'text-slate-800'}`}>{r.title}</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{r.description}</p>

                                {activeReport?.id === r.id && (
                                    <div className="mt-3 pt-3 border-t border-blue-100/50 flex items-center gap-1.5 ">
                                        <Info className="w-3 h-3 text-blue-500" />
                                        <span className="text-[10px] text-blue-600/80 font-medium italic">{r.details}</span>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Results Workspace */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-2 px-1 text-slate-400">
                        <Activity className="w-4 h-4" />
                        <h3 className="font-semibold uppercase text-[10px] tracking-widest pb-1 border-b border-slate-100 flex-1">Results Workspace</h3>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 min-h-[500px] flex flex-col overflow-hidden text-slate-800">
                        {!activeReport ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center mb-6">
                                    <Search size={32} className="opacity-20 animate-pulse" />
                                </div>
                                <h3 className="text-slate-600 font-bold text-lg mb-2">Workspace Ready</h3>
                                <p className="text-slate-400 text-sm max-w-[250px] text-center">Select an analytical report from the library to begin processing data.</p>
                            </div>
                        ) : error ? (
                            <div className="m-8 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                    <Database size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg">Query Execution Failed</h4>
                                    <p className="text-sm opacity-80">There was an error communicating with the database layer.</p>
                                    <pre className="text-xs mt-4 p-4 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto font-mono">{error}</pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full animate-up-fade">
                                {/* Result Header */}
                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-100`}>
                                            {activeReport.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-xl text-slate-900">{activeReport.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{results.length} records retrieved</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        Export Data
                                    </button>
                                </div>

                                {/* Special Rendering for Report 4 */}
                                {activeReport.id === 4 ? (
                                    <div className="p-8 space-y-8 overflow-y-auto max-h-[600px]">
                                        {['Yearly', 'Monthly', 'Weekly'].map(type => {
                                            const typeData = results.filter(r => r.Report_Type === type);
                                            if (typeData.length === 0) return null;

                                            return (
                                                <section key={type} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px bg-slate-200 flex-1" />
                                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">{type} Summary</h4>
                                                        <div className="h-px bg-slate-200 flex-1" />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {typeData.map((row, idx) => (
                                                            <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.Period}</span>
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                                                                </div>
                                                                <div className="text-2xl font-black text-slate-900 mb-1">
                                                                    <span className="text-sm font-medium text-slate-400 mr-1">৳</span>
                                                                    {Number(row.Revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                                    Updated: {row.Last_Updated.split(' ')[0]} {row.Last_Updated.split(' ')[1]}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-0 overflow-x-auto flex-1">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
                                                <tr className="border-b border-slate-200">
                                                    {results.length > 0 && Object.keys(results[0]).map(key => (
                                                        <th key={key} className="px-8 py-5 text-slate-500 font-bold uppercase text-[10px] tracking-widest">{key.replace(/_/g, ' ')}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {results.map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                                        {Object.values(row).map((val: any, j) => {
                                                            const isNumeric = typeof val === 'number' || (!isNaN(Number(val)) && String(val).includes('.'));
                                                            return (
                                                                <td key={j} className={`px-8 py-4 transition-all ${isNumeric ? 'font-mono' : 'text-slate-700'}`}>
                                                                    {val === null ? (
                                                                        <span className="text-slate-300 italic px-2 py-0.5 rounded bg-slate-50">N/A</span>
                                                                    ) : isNumeric ? (
                                                                        <span className="font-bold text-slate-900">
                                                                            {String(val).startsWith('৳') ? val : val}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="group-hover:text-blue-600 transition-colors">{String(val)}</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(n => (
                                                <div key={n} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified by system core</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Auto-refreshed periodically</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
