'use client';

import { ToastContainer } from 'react-toastify';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import { useParams } from 'next/navigation';

export default function AnalyticsPage() {
  const params = useParams();
  const databaseId = params?.id as string;

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
      {databaseId && <AnalyticsDashboard databaseId={databaseId} />}
    </>
  );
}
