'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import Topbar from '@/components/app/layout/Topbar';
import PredictionsDashboard from '@/components/app/predictions/PredictionsDashboard';

export default function PredictionsPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            <Link
              href="/submit-prediction"
              prefetch={true}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" aria-hidden />
              Submit
            </Link>
          </header>
          <PredictionsDashboard />
        </div>
      </div>
    </>
  );
}
