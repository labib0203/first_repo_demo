'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    href: string;
    label?: string;
    className?: string;
}

export default function BackButton({ href, label = 'Back', className = '' }: BackButtonProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 w-fit ${className}`}
        >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">{label}</span>
        </Link>
    );
}
