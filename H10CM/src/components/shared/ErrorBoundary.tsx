import React from 'react';
import { Box, Typography, Button, Container, Alert } from '@mui/material';
import { RefreshRounded, HomeRounded } from '@mui/icons-material';
import { debugService } from '../../services/debugService';
import { githubIntegrationService } from '../../services/githubIntegrationService';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary Caught:', error, errorInfo);
    debugService.debugError('Error Boundary Caught:', { error, errorInfo });
    this.setState({ error, errorInfo });

    // Automatically report to GitHub if auto error capture is enabled
    this.reportErrorToGitHub(error, errorInfo);
  }

  private async reportErrorToGitHub(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const config = githubIntegrationService.getConfig();
      if (config.enabled && config.autoCreateIssues) {
        const errorContext = githubIntegrationService.captureError(error, {
          errorType: 'frontend',
          severity: 'high', // React errors are typically high severity
          category: 'bug',
          component: 'React Error Boundary',
          additionalContext: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            reactError: true,
            autoReported: true,
            captureMethod: 'ErrorBoundary.componentDidCatch',
            automatic: true,
          },
        });

        await githubIntegrationService.createIssueFromError(errorContext);
        console.log('✅ React error automatically reported to GitHub');
      }
    } catch (reportError) {
      console.warn('Failed to report React error to GitHub:', reportError);
    }
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page or go
              back to the dashboard.
            </Typography>

            {this.state.error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.message}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshRounded />}
                onClick={this.handleRefresh}
                size="large"
              >
                Refresh Page
              </Button>

              <Button
                variant="outlined"
                startIcon={<HomeRounded />}
                onClick={this.handleGoHome}
                size="large"
              >
                Go to Dashboard
              </Button>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Component Stack (Development Only):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Alert>
            )}

            {debugService.shouldShowErrorDetails() && this.state.error && (
              <Alert severity="warning" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Debug Information (Admin Only):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.message}
                </Typography>
                {this.state.error.stack && (
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.7rem', mt: 1 }}>
                    Stack Trace:
                    {this.state.error.stack}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
