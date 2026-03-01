'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MultiDatabaseAnalytics from '@/components/Analytics/MultiDatabaseAnalytics';

export default function AnalyticsPage() {
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
        theme="colored"
      />
      <MultiDatabaseAnalytics />
    </>
  );
}
