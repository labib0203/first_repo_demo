'use client';

import { useState } from 'react';
import { saveConsultation } from '@/lib/actions';
import { Plus, Trash2, Save, FileText, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConsultationForm({ appointment, medicines }: { appointment: any, medicines: any[] }) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [rows, setRows] = useState<any[]>([{ id: 1, medicineId: '', dosage: '', frequency: '1-0-1', duration: 7 }]);

    const addRow = () => {
        setRows([...rows, { id: Date.now(), medicineId: '', dosage: '', frequency: '1-0-1', duration: 7 }]);
    };

    const removeRow = (id: number) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: number, field: string, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        // Append medicines as JSON
        formData.append('medicines', JSON.stringify(rows));

        const res = await saveConsultation(formData);
        if (res.success) {
            router.push('/dashboard/appointments');
        } else {
            alert(res.error || 'Failed to save consultation');
            setIsSaving(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
            <input type="hidden" name="appointmentId" value={appointment.appointment_id} />

            {/* Vitals Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="text-blue-500" /> Vitals & Observation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
                        <input name="bp" placeholder="e.g. 120/80" className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Temperature</label>
                        <input name="temp" placeholder="e.g. 98.6 F" className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                        <input name="weight" placeholder="e.g. 70" type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Diagnosis Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="text-purple-500" /> Clinical Notes
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms</label>
                        <textarea name="symptoms" required rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="Patient complaints..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                        <textarea name="diagnosis" required rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="Clinical diagnosis..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan / Notes</label>
                        <textarea name="treatment" rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="Additional advice..." />
                    </div>
                </div>
            </div>

            {/* Prescription Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Prescription (Rx)</h3>
                    <button type="button" onClick={addRow} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700">
                        <Plus size={16} /> Add Medicine
                    </button>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 w-1/3">Medicine</th>
                            <th className="px-2 py-3">Dosage</th>
                            <th className="px-2 py-3">Frequency</th>
                            <th className="px-2 py-3">Days</th>
                            <th className="px-2 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="px-6 py-3">
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={row.medicineId}
                                        onChange={(e) => updateRow(row.id, 'medicineId', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Medicine...</option>
                                        {medicines.map((m: any) => (
                                            <option key={m.medicine_id} value={m.medicine_id}>
                                                {m.name} ({m.stock_quantity} in stock)
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-3">
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        placeholder="e.g. 500mg"
                                        value={row.dosage}
                                        onChange={(e) => updateRow(row.id, 'dosage', e.target.value)}
                                        required
                                    />
                                </td>
                                <td className="px-2 py-3">
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={row.frequency}
                                        onChange={(e) => updateRow(row.id, 'frequency', e.target.value)}
                                    >
                                        <option value="1-0-1">1-0-1 (Morning-Night)</option>
                                        <option value="1-1-1">1-1-1 (Morning-Noon-Night)</option>
                                        <option value="1-0-0">1-0-0 (Morning only)</option>
                                        <option value="0-0-1">0-0-1 (Night only)</option>
                                        <option value="SOS">SOS (As needed)</option>
                                    </select>
                                </td>
                                <td className="px-2 py-3">
                                    <input
                                        type="number"
                                        className="w-20 p-2 border border-slate-200 rounded-lg"
                                        value={row.duration}
                                        onChange={(e) => updateRow(row.id, 'duration', e.target.value)}
                                        required
                                    />
                                </td>
                                <td className="px-2 py-3 text-center">
                                    <button type="button" onClick={() => removeRow(row.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={18} />
                    {isSaving ? 'Saving Record...' : 'Complete Consultation'}
                </button>
            </div>
        </form>
    );
}
