import { getUnpaidInvoices, processPayment } from '@/lib/actions';
import { CreditCard, Banknote } from 'lucide-react';

export default async function BillingPage() {
    const invoices = await getUnpaidInvoices();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Billing & Invoices</h2>
                <p className="text-slate-500">Collect payments and view pending transactions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.length === 0 ? (
                    <div className="md:col-span-3 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No pending invoices found.</p>
                    </div>
                ) : invoices.map((inv: any) => (
                    <div key={inv.invoice_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{inv.patient_name}</h3>
                                <p className="text-sm text-slate-500">ID: #{inv.invoice_id}</p>
                            </div>
                            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded">Unpaid</span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 mb-6">
                            <div className="flex justify-between">
                                <span>Doctor:</span>
                                <span className="font-medium">{inv.doctor_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date(inv.appointment_date).toLocaleDateString()}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-bold text-slate-900">
                                <span>Total Amount:</span>
                                <span>৳{inv.total_amount}</span>
                            </div>
                        </div>

                        <form action={async () => {
                            'use server';
                            await processPayment(inv.invoice_id, inv.total_amount, 'Cash');
                        }}>
                            <button className="w-full py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                                <Banknote size={16} /> Mark Paid (Cash)
                            </button>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    )
}
