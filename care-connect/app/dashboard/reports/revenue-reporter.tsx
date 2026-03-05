'use client';

import { useState } from 'react';
import { getRevenueReport } from '@/lib/actions';
import { Calendar, TrendingUp, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueReporter() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<{
        totalEarnings: number;
        departmentData: { department_name: string; total_revenue: number }[];
        timeData?: { date: string; cumulative_revenue: number }[];
    } | null>(null);

    async function handleGenerate() {
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const data = await getRevenueReport(startDate, endDate);
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 transform transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Financial Analytics</h3>
                    <p className="text-sm text-slate-500">Analyze earnings by date range and department</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Start Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">End Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !startDate || !endDate}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? 'Analyzing...' : (
                            <>
                                <Filter size={16} /> Generate Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {report && (
                <div className="animate-fade-in space-y-6">
                    {/* Total Earning Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-green-800 font-medium mb-1">Total Period Earnings</p>
                            <h4 className="text-3xl font-bold text-green-900 flex items-center gap-1">
                                <span className="text-lg">৳</span>
                                {Number(report.totalEarnings).toLocaleString()}
                            </h4>
                        </div>
                        <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center text-green-700">
                            <span className="text-2xl font-bold">৳</span>
                        </div>
                    </div>

                    {/* Department Breakdown */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-4">Department Breakdown</h4>
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3">Department / Source</th>
                                        <th className="px-5 py-3 text-right">Revenue</th>
                                        <th className="px-5 py-3 text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.departmentData.length > 0 ? report.departmentData.map((dept: { department_name: string; total_revenue: number }, i: number) => {
                                        const share = report.totalEarnings > 0
                                            ? Math.round((Number(dept.total_revenue) / report.totalEarnings) * 100)
                                            : 0;

                                        return (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3 font-medium text-slate-700">{dept.department_name}</td>
                                                <td className="px-5 py-3 text-right font-mono text-slate-600">৳{Number(dept.total_revenue).toLocaleString()}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-600">
                                                        {share}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic">
                                                No revenue recorded for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue Timeline Graph */}
                    {report.timeData && report.timeData.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4 mt-8">
                                <h4 className="font-bold text-slate-800">Growth Projection</h4>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Cumulative Revenue
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-200 border border-slate-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp size={120} className="text-green-500" />
                                </div>
                                <div className="h-[350px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={report.timeData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#475569"
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' }).substring(0, 3)}`;
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                minTickGap={40}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#475569"
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                tickFormatter={(val) => `৳${Number(val) >= 1000 ? (val / 1000) + 'k' : val}`}
                                                axisLine={false}
                                                tickLine={false}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                                                cursor={{ stroke: '#334155', strokeWidth: 2 }}
                                                formatter={(value: unknown) => [`৳${Number(value).toLocaleString()}`, 'Total Revenue']}
                                                labelFormatter={(label: unknown) => (
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{new Date(label as string).toDateString()}</span>
                                                )}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="cumulative_revenue"
                                                stroke="#22c55e"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorRev)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
