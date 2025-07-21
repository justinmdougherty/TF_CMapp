import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Spinner from './views/spinner/Spinner';
import './utils/i18n';
import { CustomizerContextProvider } from './context/CustomizerContext';

// React Query Imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with error retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 0, // Make data stale immediately so it refetches more often
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CustomizerContextProvider>
        <Suspense fallback={<Spinner />}>
          <App />
        </Suspense>
      </CustomizerContextProvider>
      {/* The devtools are recommended for a better development experience */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </React.StrictMode>,
);
