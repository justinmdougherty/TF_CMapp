import React, { useEffect, useState } from 'react';
import certificateService, { UserAuthInfo } from '../../services/certificateService';
import AccessRequestSplash from './AccessRequestSplash';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UserAuthInfo | null;
    error: string | null;
  }>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  const checkAuthentication = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const user = await certificateService.getCurrentUser();

      // Check if we have a valid user with authentication
      if (user && user.username && user.displayName) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user,
          error: null,
        });
      } else {
        // No valid authentication found
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: 'Authentication required',
        });
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  // Show loading spinner while checking authentication
  if (authState.isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: 'background.default' }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Verifying Authentication...
        </Typography>
      </Box>
    );
  }

  // Show access request splash if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <AccessRequestSplash
        onRequestSubmitted={() => {
          // After submitting request, recheck authentication
          setTimeout(() => {
            checkAuthentication();
          }, 5000); // Check again in 5 seconds
        }}
      />
    );
  }

  // User is authenticated, show the main application
  return <>{children}</>;
};

export default AuthWrapper;
