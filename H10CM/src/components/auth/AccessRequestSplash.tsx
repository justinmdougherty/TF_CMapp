import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface AccessRequestSplashProps {
  onRequestSubmitted?: () => void;
  onRetryAuth?: () => void;
}

const AccessRequestSplash: React.FC<AccessRequestSplashProps> = ({
  onRequestSubmitted,
  onRetryAuth,
}) => {
  const [formData, setFormData] = useState({
    requestedProgram: '',
    accessLevel: 'Read',
    justification: '',
    contactEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // In a real implementation, this would submit the access request
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitSuccess(true);
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      setSubmitError(
        'Failed to submit access request. Please try again or contact your administrator.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: 'background.default' }}
      >
        <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Access Request Submitted
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your access request has been submitted successfully. A system administrator will
              review your request and contact you at the provided email address.
            </Typography>
            <Alert severity="info">
              Please check your email for updates on your request status.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default' }}
    >
      <Card sx={{ maxWidth: 600, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              H10 Production Management System
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Access Required
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You need authorized access to use this system. Please submit an access request below,
              and a system administrator will review your request.
            </Typography>
          </Alert>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Request System Access
          </Typography>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Requested Program/Department"
              placeholder="e.g., Manufacturing Unit A, Quality Assurance Lab"
              value={formData.requestedProgram}
              onChange={handleInputChange('requestedProgram')}
              InputProps={{
                startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              required
            />

            <TextField
              fullWidth
              select
              label="Requested Access Level"
              value={formData.accessLevel}
              onChange={handleInputChange('accessLevel')}
              SelectProps={{ native: true }}
              required
            >
              <option value="Read">Read Access</option>
              <option value="Write">Write Access</option>
              <option value="Admin">Admin Access</option>
            </TextField>

            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              placeholder="your.email@organization.mil"
              value={formData.contactEmail}
              onChange={handleInputChange('contactEmail')}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Justification for Access"
              placeholder="Please describe why you need access to this system and how you plan to use it..."
              value={formData.justification}
              onChange={handleInputChange('justification')}
              required
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Required Access Level Information:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label="Read: View data only"
                  size="small"
                  color={formData.accessLevel === 'Read' ? 'primary' : 'default'}
                />
                <Chip
                  label="Write: Create and modify data"
                  size="small"
                  color={formData.accessLevel === 'Write' ? 'primary' : 'default'}
                />
                <Chip
                  label="Admin: Full system management"
                  size="small"
                  color={formData.accessLevel === 'Admin' ? 'primary' : 'default'}
                />
              </Stack>
            </Box>

            {submitError && <Alert severity="error">{submitError}</Alert>}

            {onRetryAuth && (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={onRetryAuth}
                startIcon={<SecurityIcon />}
                sx={{ mb: 2 }}
              >
                Retry Authentication
              </Button>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmitRequest}
              disabled={
                isSubmitting ||
                !formData.requestedProgram ||
                !formData.contactEmail ||
                !formData.justification
              }
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <PersonIcon />}
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Access Request'}
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Need immediate assistance? Contact your system administrator or IT support.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccessRequestSplash;
