// src/main.tsx (or App.tsx)
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Spinner from './views/spinner/Spinner';
import './utils/i18n';
import { CustomizerContextProvider } from './context/CustomizerContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import

const queryClient = new QueryClient({
  // Optional: Global query client configuration
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Default, good to keep
      staleTime: 5 * 60 * 1000, // 5 minutes before data is considered stale
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {' '}
    {/* Or remove StrictMode if causing double invokes you don't want */}
    <QueryClientProvider client={queryClient}>
      {' '}
      {/* Wrap with QueryClientProvider */}
      <CustomizerContextProvider>
        <Suspense fallback={<Spinner />}>
          <App />
        </Suspense>
      </CustomizerContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
