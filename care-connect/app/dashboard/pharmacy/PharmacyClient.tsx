'use client';

import { useState } from 'react';
import { Pill, AlertTriangle, PlusCircle, Package, ShoppingCart } from 'lucide-react';
import { restockMedicine } from '@/lib/actions';
import SellMedicineModal from './SellMedicineModal';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/ui/BackButton';

export default function PharmacyClient({ medicines, patients, role }: { medicines: any[], patients: any[], role: string | null }) {
    const [selectedMed, setSelectedMed] = useState<any>(null);
    const [isRestocking, setIsRestocking] = useState(false);
    const [isSaleOpen, setIsSaleOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="space-y-6 animate-fade-in">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Pill className="text-purple-600" />
                        Pharmacy Inventory
                    </h1>
                    <p className="text-slate-500">
                        {role === 'Pharmacist' ? 'Monitor stock levels and manage restocking.' : 'Monitor medicine stock availability.'}
                    </p>
                </div>
                {role === 'Pharmacist' && (
                    <button
                        onClick={() => setIsSaleOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 font-medium"
                    >
                        <ShoppingCart size={18} /> New Sale
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((med) => (
                    <div
                        key={med.medicine_id}
                        className={`bg-white rounded-xl p-6 border transition-all hover:shadow-md
                        ${med.stock_quantity < 50 ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900">{med.name}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">{med.manufacturer}</p>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                ৳{med.unit_price}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className={`flex items-center gap-2 font-mono text-lg font-bold
                                ${med.stock_quantity < 50 ? 'text-red-600' : 'text-slate-700'}`}>
                                <Package size={20} />
                                {med.stock_quantity}
                            </div>
                            {med.stock_quantity < 50 && (
                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                                    <AlertTriangle size={12} /> Low Stock
                                </span>
                            )}
                        </div>

                        {role === 'Pharmacist' && (
                            <button
                                onClick={() => setSelectedMed(med)}
                                className="w-full py-2 border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                <PlusCircle size={16} /> Restock
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Restock Modal */}
            {selectedMed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Restock {selectedMed.name}</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Adding stock will deduct the cost from the hospital's total earnings.
                            </p>

                            <form action={async (formData) => {
                                setIsRestocking(true);
                                const res = await restockMedicine(formData);
                                if (!res.success) {
                                    alert(res.error || "Failed to restock");
                                    setIsRestocking(false);
                                    return;
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                                router.refresh();
                                setIsRestocking(false);
                                setSelectedMed(null);
                            }}>
                                <input type="hidden" name="medicineId" value={selectedMed.medicine_id} />

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Add</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            required
                                            min="1"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="e.g., 100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (Expense)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-slate-400">৳</span>
                                            <input
                                                type="number"
                                                name="unitCost"
                                                required
                                                step="0.01"
                                                defaultValue={(selectedMed.unit_price * 0.8).toFixed(2)} // Auto-suggest slightly lower than selling price
                                                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Suggested buy price is 80% of sell price.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMed(null)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isRestocking}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                                    >
                                        {isRestocking ? 'Processing...' : 'Confirm Restock'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Sell Modal */}
            <SellMedicineModal
                isOpen={isSaleOpen}
                onClose={() => setIsSaleOpen(false)}
                medicines={medicines}
                patients={patients}
            />
        </div>
    );
}
