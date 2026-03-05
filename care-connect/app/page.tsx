

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Lock, Mail, ArrowRight, Loader2, Database, ShieldCheck, UserCog, ChevronLeft, Pill, Microscope } from 'lucide-react';
import { verifyLogin } from '@/lib/actions';

type Role = 'Admin' | 'Receptionist' | 'Pharmacist' | 'Pathologist' | null;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Artificial delay to show off the loading animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const res = await verifyLogin(formData);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Login failed');
      setLoading(false);
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="mb-12 flex flex-col items-center animate-fade-in-down">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 mb-6">
            <HeartPulse className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">CareConnect</h1>
          <p className="text-slate-500 mt-3 text-lg">Select your portal to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl animate-fade-in-up">
          <button
            onClick={() => setSelectedRole('Admin')}
            className="group relative bg-white p-6 rounded-2xl shadow-md border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="p-4 bg-slate-100 w-fit rounded-xl mb-6 group-hover:scale-110 transition-transform origin-left">
              <ShieldCheck className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Administrator</h3>
            <p className="text-slate-500 text-sm">Manage doctors, view earnings, and oversee hospital operations.</p>
          </button>

          <button
            onClick={() => setSelectedRole('Receptionist')}
            className="group relative bg-white p-6 rounded-2xl shadow-md border-2 border-slate-100 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="absolute top-6 right-6 p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="p-4 bg-slate-100 w-fit rounded-xl mb-6 group-hover:scale-110 transition-transform origin-left">
              <UserCog className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Receptionist</h3>
            <p className="text-slate-500 text-sm">Manage patients, appointments, and room bookings.</p>
          </button>

          <button
            onClick={() => setSelectedRole('Pharmacist')}
            className="group relative bg-white p-6 rounded-2xl shadow-md border-2 border-slate-100 hover:border-purple-500 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="absolute top-6 right-6 p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="p-4 bg-slate-100 w-fit rounded-xl mb-6 group-hover:scale-110 transition-transform origin-left">
              <Pill className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pharmacist</h3>
            <p className="text-slate-500 text-sm">Manage medicines, stock inventory, and process sales.</p>
          </button>

          <button
            onClick={() => setSelectedRole('Pathologist')}
            className="group relative bg-white p-6 rounded-2xl shadow-md border-2 border-slate-100 hover:border-rose-500 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="p-4 bg-slate-100 w-fit rounded-xl mb-6 group-hover:scale-110 transition-transform origin-left">
              <Microscope className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pathologist</h3>
            <p className="text-slate-500 text-sm">Track lab tests, update patient reports, and view earnings.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

      <button
        onClick={() => setSelectedRole(null)}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Role Selection
      </button>

      <div className="mb-8 flex flex-col items-center animate-fade-in-down">
        <div className={`p-3 rounded-2xl shadow-lg mb-4 ${selectedRole === 'Admin' ? 'bg-blue-600 shadow-blue-500/20' :
          selectedRole === 'Receptionist' ? 'bg-emerald-600 shadow-emerald-500/20' :
            selectedRole === 'Pharmacist' ? 'bg-purple-600 shadow-purple-500/20' :
              'bg-rose-600 shadow-rose-500/20'
          }`}>
          {selectedRole === 'Admin' ? <ShieldCheck className="w-8 h-8 text-white" /> :
            selectedRole === 'Receptionist' ? <UserCog className="w-8 h-8 text-white" /> :
              selectedRole === 'Pharmacist' ? <Pill className="w-8 h-8 text-white" /> :
                <Microscope className="w-8 h-8 text-white" />}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{selectedRole} Portal</h1>
        <p className="text-slate-500 mt-2">Enter credentials to access dashboard</p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className={`p-4 rounded-full mb-4 animate-bounce ${selectedRole === 'Admin' ? 'bg-blue-100 text-blue-600' :
            selectedRole === 'Receptionist' ? 'bg-emerald-100 text-emerald-600' :
              selectedRole === 'Pharmacist' ? 'bg-purple-100 text-purple-600' :
                'bg-rose-100 text-rose-600'
            }`}>
            <HeartPulse className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 animate-pulse">Authenticating...</h2>
          <p className="text-slate-500 mt-2">Please wait while we verify your credentials</p>
        </div>
      )}

      <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up ${loading ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 disabled:opacity-70"
                  placeholder={
                    selectedRole === 'Admin' ? "admin@careconnect.bd" :
                      selectedRole === 'Receptionist' ? "reception@careconnect.bd" :
                        selectedRole === 'Pharmacist' ? "pharmacy@careconnect.bd" :
                          "pathology@careconnect.bd"
                  }
                  defaultValue={
                    selectedRole === 'Admin' ? "admin@careconnect.bd" :
                      selectedRole === 'Receptionist' ? "reception@careconnect.bd" :
                        selectedRole === 'Pharmacist' ? "pharmacy@careconnect.bd" :
                          "pathology@careconnect.bd"
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 disabled:opacity-70"
                  placeholder="••••••••"
                  defaultValue={
                    selectedRole === 'Admin' ? "admin123" :
                      selectedRole === 'Receptionist' ? "reception123" :
                        selectedRole === 'Pharmacist' ? "pharmacy123" :
                          "pathology123"
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${selectedRole === 'Admin' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                selectedRole === 'Receptionist' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                  selectedRole === 'Pharmacist' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' :
                    'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                } disabled:opacity-80 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  Login as {selectedRole}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
