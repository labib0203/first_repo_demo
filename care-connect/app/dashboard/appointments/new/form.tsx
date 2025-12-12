'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function BookAppointmentForm({ doctors, patients, bookAction }: any) {

    async function handleSubmit(formData: FormData) {
        const res = await bookAction(formData);
        if (res.success) {
            alert('Appointment Booked Successfully!');
            window.location.href = '/dashboard';
        } else {
            alert('Booking Failed: ' + res.error);
        }
    }

    return (
        <form action={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Patient</label>
                <select name="patientId" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    <option value="">Select Patient...</option>
                    {patients.map((p: any) => (
                        <option key={p.patient_id} value={p.patient_id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Doctor</label>
                <select name="doctorId" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    <option value="">Select Doctor...</option>
                    {doctors.map((d: any) => (
                        <option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialization}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date & Time</label>
                <input name="date" type="datetime-local" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reason for Visit</label>
                <textarea name="reason" rows={3} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => window.history.back()} className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <SubmitButton />
            </div>
        </form>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button type="submit" disabled={pending} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {pending && <Loader2 className="animate-spin w-4 h-4" />}
            Confirm Booking
        </button>
    )
}
