import { getPendingTests } from '@/lib/actions';
import { ResultsClient } from './ResultsClient';
import { cookies } from 'next/headers';

export default async function TestResultsPage() {
    const orders = await getPendingTests();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    let role = null;
    if (session) {
        try {
            role = JSON.parse(session.value).role;
        } catch (e) { }
    }

    return <ResultsClient orders={orders as any[]} role={role} />;
}
