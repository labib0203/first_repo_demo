import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NewStaffForm from './new-staff-form';
import { getDepartments } from '@/lib/actions';
import BackButton from '@/components/ui/BackButton';

export default async function NewStaffPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;

    if (session) {
        try {
            const data = JSON.parse(session.value);
            role = data.role;
        } catch (e) {
            // Invalid session
        }
    }

    if (role !== 'Admin') {
        redirect('/dashboard/staff');
    }

    const departments = await getDepartments();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <BackButton href="/dashboard/staff" label="Back to Staff List" />
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-800">Add New Staff Member</h1>
                <p className="text-slate-500 text-sm">Create a new profile for a non-medical staff member (Receptionist, HR, etc.).</p>
            </div>
            <NewStaffForm departments={departments} />
        </div>
    );
}
