import Link from "next/link";
import { ArrowRight, Activity, Calendar, Shield, Users, Database, HeartPulse } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
              CareConnect
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#doctors" className="hover:text-blue-600 transition-colors">Doctors</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next Generation Healthcare Management
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
            Healthcare Data, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
              Perfectly Synchronized.
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Experience the power of a fully integrated Database Management System.
            From complex SQL queries to seamless patient records, CareConnect delivers
            precision and performance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group relative px-8 py-4 text-base font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all shadow-xl hover:translate-y-[-2px]"
            >
              Launch Demo System
              <ArrowRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#docs"
              className="px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-slate-600">Built to meet rigorous Database Requirements</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Database className="w-6 h-6 text-blue-600" />}
              title="Complex SQL Engine"
              description="Powered by 10+ complex analytical queries, 3NF normalization, and optimized indexing strategies."
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-emerald-500" />}
              title="Real-time Analytics"
              description="Track patient vitals and hospital revenue with stored procedures and dynamic reporting views."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-purple-500" />}
              title="Secure & Audited"
              description="Full audit logging via triggers, role-based access control, and transaction consistency."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-orange-500" />}
              title="Smart Scheduling"
              description="Automated appointment booking with conflict detection functions and seamless workflow."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-pink-500" />}
              title="Patient Portal"
              description="Dedicated dashboards for patients to view history, prescriptions, and lab results."
            />
            <FeatureCard
              icon={<ArrowRight className="w-6 h-6 text-cyan-500" />}
              title="Advanced Workflows"
              description="Multi-step business logic including insurance claims and inventory management."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-semibold text-white">CareConnect</span>
          </div>
          <p className="text-sm">© 2024 CareConnect Systems. Built for RDBMS Course Project.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
