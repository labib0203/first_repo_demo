import { getAppointmentById, getMedicines } from '@/lib/actions';
import ConsultationForm from './ConsultationForm';
import BackButton from '@/components/ui/BackButton';
import { notFound, redirect } from 'next/navigation';

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appointment = await getAppointmentById(id);
    const medicines = await getMedicines() as any[];

    if (!appointment) return notFound();

    return (
        <div className="animate-fade-in">
            <BackButton href="/dashboard/appointments" label="Back to Appointments" />

            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Medical Consultation</h1>
                        <p className="text-slate-500 mt-1">Create a new medical record and prescription.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">Appointment ID</div>
                        <div className="text-xl font-mono font-bold text-slate-900">#{appointment.appointment_id}</div>
                    </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <div className="text-xs font-semibold text-blue-600 uppercase mb-1">Patient</div>
                        <div className="font-bold text-slate-900 text-lg">{appointment.patient_first} {appointment.patient_last}</div>
                        <div className="text-sm text-slate-600">{appointment.gender}, Age: {new Date().getFullYear() - new Date(appointment.date_of_birth).getFullYear()}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-blue-600 uppercase mb-1">Doctor</div>
                        <div className="font-bold text-slate-900 text-lg">Dr. {appointment.doc_first} {appointment.doc_last}</div>
                        <div className="text-sm text-slate-600">{appointment.specialization}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-blue-600 uppercase mb-1">Reason</div>
                        <div className="font-medium text-slate-900">{appointment.reason || 'General Visit'}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-blue-600 uppercase mb-1">Date</div>
                        <div className="font-medium text-slate-900">{new Date(appointment.appointment_date).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <ConsultationForm appointment={appointment} medicines={medicines} />
        </div>
    );
}
