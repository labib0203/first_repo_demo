import { getAllPatientsList, getRoomAvailabilityStats, getActiveAdmissions } from '@/lib/actions';
import RoomBookingClient from './RoomBookingClient';
import DischargeClient from './DischargeClient';
import BackButton from '@/components/ui/BackButton';
import { cookies } from 'next/headers';

export default async function RoomBookingPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;
    if (session) {
        try {
            const data = JSON.parse(session.value);
            role = data.role;
        } catch (e) { }
    }

    // In a real app with Auth, we would fetch ONLY the logged in patient if role is patient.
    // For this demo (Admin/Shared View), we pass all patients to allow "Booking For" functionality.

    let patients = [];
    let availabilityStats = {};
    let activeAdmissions = [];
    try {
        patients = await getAllPatientsList() as any[];
        availabilityStats = await getRoomAvailabilityStats();
        activeAdmissions = await getActiveAdmissions();
    } catch (e) {
        console.error(e);
    }

    return (
        <div className="animate-fade-in relative">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="space-y-8">
                <RoomBookingClient patients={patients} availability={availabilityStats} role={role} />
                <DischargeClient admissions={activeAdmissions} role={role} />
            </div>
        </div>
    );
}
