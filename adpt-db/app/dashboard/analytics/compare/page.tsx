'use client';

import { ToastContainer } from 'react-toastify';
import ComparisonDashboard from '@/components/Analytics/ComparisonDashboard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids');
  const databaseIds = ids ? ids.split(',').filter(Boolean) : [];

  if (databaseIds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">No databases selected for comparison.</p>
      </div>
    );
  }

  return <ComparisonDashboard databaseIds={databaseIds} />;
}

export default function ComparePage() {
  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
        <CompareContent />
      </Suspense>
    </>
  );
}
