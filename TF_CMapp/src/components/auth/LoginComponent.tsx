import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  VpnKey as CertIcon,
  PersonAdd as RegisterIcon,
} from '@mui/icons-material';
import { useRBAC } from '../../context/RBACContext';
import { UserProfile, UserRole } from '../../types/UserPermissions';

interface LoginComponentProps {
  onLoginSuccess?: (user: UserProfile) => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLoginSuccess }) => {
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    loginWithCertificate,
    loginAsUser,
    requestAccess,
    getAllUsers,
  } = useRBAC();

  const [loginMode, setLoginMode] = useState<'certificate' | 'development' | 'register'>(
    'certificate',
  );
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    email: '',
    fullName: '',
    requestedRole: 'Visitor' as UserRole,
    justification: '',
  });

  // Load available users for development mode
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // For development, we'll use the mock users directly
        const mockUsers: UserProfile[] = [
          {
            user_id: 'admin-001',
            email: 'admin@tfproject.com',
            full_name: 'System Administrator',
            role: 'Admin',
            status: 'Active',
            created_date: new Date('2024-01-01'),
            permissions: [],
          },
          {
            user_id: 'pm-001',
            email: 'pm@tfproject.com',
            full_name: 'Project Manager',
            role: 'ProjectManager',
            status: 'Active',
            created_date: new Date('2024-01-15'),
            permissions: [],
          },
          {
            user_id: 'tech-001',
            email: 'tech@tfproject.com',
            full_name: 'Lead Technician',
            role: 'Technician',
            status: 'Active',
            created_date: new Date('2024-02-01'),
            permissions: [],
          },
          {
            user_id: 'visitor-001',
            email: 'visitor@tfproject.com',
            full_name: 'Guest User',
            role: 'Visitor',
            status: 'Active',
            created_date: new Date('2024-02-15'),
            permissions: [],
          },
        ];
        setAvailableUsers(mockUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    if (loginMode === 'development') {
      loadUsers();
    }
  }, [loginMode]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && onLoginSuccess) {
      onLoginSuccess(currentUser);
    }
  }, [isAuthenticated, currentUser, onLoginSuccess]);

  const handleCertificateLogin = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const success = await loginWithCertificate();
      if (success) {
        setMessage({ type: 'success', text: 'Certificate authentication successful!' });
      } else {
        setMessage({
          type: 'error',
          text: 'No valid certificate found. Please ensure your client certificate is installed and try again.',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Certificate authentication failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevelopmentLogin = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user to login as.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const selectedUser = availableUsers.find((u) => u.user_id === selectedUserId);
      if (selectedUser) {
        await loginAsUser(selectedUser);
        setMessage({ type: 'success', text: `Logged in as ${selectedUser.full_name}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistration = async () => {
    if (!registrationForm.email || !registrationForm.fullName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await requestAccess(
        registrationForm.email,
        registrationForm.fullName,
        registrationForm.requestedRole,
        registrationForm.justification,
      );
      setMessage({
        type: 'success',
        text: 'Access request submitted successfully! An administrator will review your request.',
      });
      setRegistrationForm({
        email: '',
        fullName: '',
        requestedRole: 'Visitor',
        justification: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'ProjectManager':
        return 'primary';
      case 'Technician':
        return 'success';
      case 'Visitor':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
            Successfully Authenticated
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <PersonIcon />
            <Box>
              <Typography variant="subtitle1">{currentUser.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser.email}
              </Typography>
            </Box>
            <Chip label={currentUser.role} color={getRoleColor(currentUser.role)} size="small" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" component="h1">
            TF Project Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please authenticate to access the system
          </Typography>
        </Box>

        {/* Login Mode Selection */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            variant={loginMode === 'certificate' ? 'contained' : 'outlined'}
            startIcon={<CertIcon />}
            onClick={() => setLoginMode('certificate')}
            size="small"
          >
            Certificate
          </Button>
          <Button
            variant={loginMode === 'development' ? 'contained' : 'outlined'}
            startIcon={<PersonIcon />}
            onClick={() => setLoginMode('development')}
            size="small"
          >
            Development
          </Button>
          <Button
            variant={loginMode === 'register' ? 'contained' : 'outlined'}
            startIcon={<RegisterIcon />}
            onClick={() => setLoginMode('register')}
            size="small"
          >
            Register
          </Button>
        </Stack>

        {/* Message Display */}
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        {/* Certificate Authentication */}
        {loginMode === 'certificate' && (
          <Stack spacing={2}>
            <Typography variant="body2">
              Use your client certificate to authenticate as an administrator with full system
              access.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CertIcon />}
              onClick={handleCertificateLogin}
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Authenticating...' : 'Authenticate with Certificate'}
            </Button>
          </Stack>
        )}

        {/* Development Login */}
        {loginMode === 'development' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="warning.main">
              Development Mode: Select a user to login as (for testing purposes only)
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select User</InputLabel>
              <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                {availableUsers.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    <Stack direction="row" spacing={1} alignItems="center" width="100%">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{user.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={handleDevelopmentLogin}
              disabled={isSubmitting || !selectedUserId}
              fullWidth
            >
              {isSubmitting ? 'Logging in...' : 'Login as Selected User'}
            </Button>
          </Stack>
        )}

        {/* Registration Form */}
        {loginMode === 'register' && (
          <Stack spacing={2}>
            <Typography variant="body2">
              Request access to the TF Project system. An administrator will review your request.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) =>
                    setRegistrationForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={registrationForm.fullName}
                  onChange={(e) =>
                    setRegistrationForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Requested Role</InputLabel>
                  <Select
                    value={registrationForm.requestedRole}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        requestedRole: e.target.value as UserRole,
                      }))
                    }
                  >
                    <MenuItem value="ProjectManager">Project Manager</MenuItem>
                    <MenuItem value="Technician">Technician</MenuItem>
                    <MenuItem value="Visitor">Visitor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Justification (Optional)"
                  multiline
                  rows={3}
                  value={registrationForm.justification}
                  onChange={(e) =>
                    setRegistrationForm((prev) => ({ ...prev, justification: e.target.value }))
                  }
                  placeholder="Please explain why you need access and what role would be appropriate..."
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              startIcon={<RegisterIcon />}
              onClick={handleRegistration}
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Access Request'}
            </Button>
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block' }}
        >
          TF Project Management System - Secure Access Required
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LoginComponent;
