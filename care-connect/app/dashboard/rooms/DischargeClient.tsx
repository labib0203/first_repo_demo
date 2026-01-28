'use client';

import { useState } from 'react';
import { dischargePatient } from '@/lib/actions';
import { LogOut, FileText, CheckCircle, Clock, Building2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function DischargeClient({ admissions, role }: { admissions: any[], role?: string }) {
    const [isDischarging, setIsDischarging] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<number | null>(null);

    const handleDischargeClick = (admissionId: number) => {
        setSelectedAdmission(admissionId);
        setShowConfirmModal(true);
    };

    const handleConfirmDischarge = async () => {
        if (!selectedAdmission) return;

        setIsDischarging(true);
        const res = await dischargePatient(selectedAdmission);
        setIsDischarging(false);

        if (res.success) {
            setSuccessData(res);
        } else {
            alert(res.error || 'Failed to discharge patient');
        }

        setSelectedAdmission(null);
    };


    return (
        <>
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmDischarge}
                title="Discharge Patient"
                message="Are you sure you want to discharge this patient? This will generate the final bill and free up the room."
                confirmText="Discharge"
                cancelText="Cancel"
                variant="warning"
                icon={<AlertTriangle size={24} />}
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <LogOut className="text-orange-600" size={20} />
                        Active Admissions (In-Patient)
                    </h3>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {admissions.length} Active
                    </span>
                </div>

                {successData && (
                    <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3 text-green-800">
                            <CheckCircle size={20} />
                            <div>
                                <p className="font-bold">{successData.message}</p>
                                <p className="text-sm">Invoice #{successData.invoiceId} generated.</p>
                            </div>
                        </div>
                        <Link
                            href={`/dashboard/billing/${successData.invoiceId}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                        >
                            <FileText size={16} /> View Final Bill
                        </Link>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Patient</th>
                                <th className="px-6 py-3">Room</th>
                                <th className="px-6 py-3">Admitted Since</th>
                                <th className="px-6 py-3">Est. Bill so far</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {admissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No patients currently admitted.
                                    </td>
                                </tr>
                            ) : admissions.map((adm) => (
                                <tr key={adm.admission_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {adm.first_name} {adm.last_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Building2 size={16} />
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{adm.room_number}</span>
                                            <span className="text-xs text-slate-400">({adm.type})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-400" />
                                            {new Date(adm.admission_date).toISOString().split('T')[0]}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        ৳{Number(adm.estimated_cost).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDischargeClick(adm.admission_id)}
                                            disabled={isDischarging}
                                            className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors disabled:opacity-50"
                                        >
                                            Discharge
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
