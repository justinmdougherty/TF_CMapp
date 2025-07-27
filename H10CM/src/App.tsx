import { useContext, useEffect } from 'react';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { RBACProvider } from 'src/context/RBACContext';
import { ThemeSettings } from './theme/Theme';
import RTL from './layouts/full/shared/customizer/RTL';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { Toaster } from './services/notificationService';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { initializeSearchSystem } from './services/searchInitializer';
import { githubIntegrationService } from './services/githubIntegrationService';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  const theme = ThemeSettings();
  const { activeDir } = useContext(CustomizerContext);

  // Initialize search system and GitHub error capture on app startup
  useEffect(() => {
    initializeSearchSystem();

    // Initialize automatic error capture for GitHub integration
    const initializeErrorCapture = async () => {
      try {
        const config = githubIntegrationService.getConfig();
        if (config.enabled && config.autoCreateIssues) {
          // Enable automatic error capture without user context initially
          // User context will be added when authentication is available
          githubIntegrationService.enableAutoErrorCapture();
          console.log('✅ GitHub automatic error capture initialized');
        }
      } catch (error) {
        console.warn('GitHub error capture initialization failed:', error);
      }
    };

    initializeErrorCapture();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <RBACProvider>
          <ThemeProvider theme={theme}>
            <RTL direction={activeDir}>
              <CssBaseline />
              <RouterProvider router={router} />
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  className: '',
                  duration: 4000,
                  style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    maxWidth: '400px',
                    boxShadow: theme.shadows[4],
                  },
                  success: {
                    duration: 4000,
                    style: {
                      background: theme.palette.success.main,
                      color: theme.palette.success.contrastText,
                    },
                  },
                  error: {
                    duration: 6000,
                    style: {
                      background: theme.palette.error.main,
                      color: theme.palette.error.contrastText,
                    },
                  },
                }}
              />
            </RTL>
          </ThemeProvider>
        </RBACProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
