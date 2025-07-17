import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as FundIcon,
  Business as SponsorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Schedule as ExpiringIcon,
} from '@mui/icons-material';
import {
  useSponsors,
  useCreateSponsor,
  useUpdateSponsor,
} from '../../../hooks/api/useProcurementHooks';
import {
  useSponsorFunds,
  useCreateSponsorFund,
  useUpdateSponsorFund,
} from '../../../hooks/api/useProcurementHooks';
import {
  Sponsor,
  SponsorFund,
  CreateSponsorRequest,
  CreateSponsorFundRequest,
} from '../../../types/ProcurementTypes';
import { useRBAC } from '../../../context/RBACContext';

const SponsorFundManagement: React.FC = () => {
  const { currentUser, hasRole } = useRBAC();

  // State management
  const [activeTab, setActiveTab] = useState<'sponsors' | 'funds'>('sponsors');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [selectedFund, setSelectedFund] = useState<SponsorFund | null>(null);
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [sponsorForm, setSponsorForm] = useState<Partial<CreateSponsorRequest>>({
    sponsor_name: '',
    sponsor_code: '',
    organization_type: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    billing_address: '',
    tax_id: '',
    payment_terms: '',
    status: 'Active',
    notes: '',
  });

  const [fundForm, setFundForm] = useState<Partial<CreateSponsorFundRequest>>({
    fund_name: '',
    fund_code: '',
    fund_type: '',
    total_amount: 0,
    effective_date: '',
    expiration_date: '',
    approval_status: 'Pending',
    status: 'Active',
    restrictions: '',
    reporting_requirements: '',
    notes: '',
  });

  // Data hooks
  const { data: sponsors, isLoading: sponsorsLoading, refetch: refetchSponsors } = useSponsors();
  const { data: sponsorFunds, isLoading: fundsLoading, refetch: refetchFunds } = useSponsorFunds();
  const createSponsorMutation = useCreateSponsor();
  const updateSponsorMutation = useUpdateSponsor();
  const createFundMutation = useCreateSponsorFund();
  const updateFundMutation = useUpdateSponsorFund();

  // Access control
  const canManage = hasRole('Admin') || hasRole('ProjectManager');

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'default';
      case 'Suspended':
        return 'error';
      case 'Expired':
        return 'warning';
      case 'Exhausted':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <ActiveIcon />;
      case 'Inactive':
        return <InactiveIcon />;
      case 'Suspended':
      case 'Exhausted':
        return <WarningIcon />;
      case 'Expired':
        return <ExpiringIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    if (!expirationDate) return null;
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (expirationDate: string) => {
    const daysUntil = getDaysUntilExpiration(expirationDate);
    if (daysUntil === null) return 'safe';
    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 7) return 'critical';
    if (daysUntil <= 30) return 'warning';
    return 'safe';
  };

  // Event handlers
  const handleCreateSponsor = () => {
    setSelectedSponsor(null);
    setSponsorForm({
      sponsor_name: '',
      sponsor_code: '',
      organization_type: '',
      primary_contact_name: '',
      primary_contact_email: '',
      primary_contact_phone: '',
      billing_address: '',
      tax_id: '',
      payment_terms: '',
      status: 'Active',
      notes: '',
    });
    setIsEditing(false);
    setSponsorDialogOpen(true);
  };

  const handleEditSponsor = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setSponsorForm({
      sponsor_name: sponsor.sponsor_name,
      sponsor_code: sponsor.sponsor_code,
      organization_type: sponsor.organization_type || '',
      primary_contact_name: sponsor.primary_contact_name || '',
      primary_contact_email: sponsor.primary_contact_email || '',
      primary_contact_phone: sponsor.primary_contact_phone || '',
      billing_address: sponsor.billing_address || '',
      tax_id: sponsor.tax_id || '',
      payment_terms: sponsor.payment_terms || '',
      status: sponsor.status,
      notes: sponsor.notes || '',
    });
    setIsEditing(true);
    setSponsorDialogOpen(true);
  };

  const handleCreateFund = (sponsorId?: number) => {
    setSelectedFund(null);
    setFundForm({
      sponsor_id: sponsorId || selectedSponsor?.sponsor_id,
      fund_name: '',
      fund_code: '',
      fund_type: '',
      total_amount: 0,
      effective_date: '',
      expiration_date: '',
      approval_status: 'Pending',
      status: 'Active',
      restrictions: '',
      reporting_requirements: '',
      notes: '',
    });
    setIsEditing(false);
    setFundDialogOpen(true);
  };

  const handleEditFund = (fund: SponsorFund) => {
    setSelectedFund(fund);
    setFundForm({
      sponsor_id: fund.sponsor_id,
      fund_name: fund.fund_name,
      fund_code: fund.fund_code,
      fund_type: fund.fund_type,
      total_amount: fund.total_amount,
      effective_date: fund.effective_date.split('T')[0], // Format for date input
      expiration_date: fund.expiration_date ? fund.expiration_date.split('T')[0] : '',
      approval_status: fund.approval_status,
      status: fund.status,
      restrictions: fund.restrictions || '',
      reporting_requirements: fund.reporting_requirements || '',
      notes: fund.notes || '',
    });
    setIsEditing(true);
    setFundDialogOpen(true);
  };

  const handleSaveSponsor = async () => {
    if (!currentUser) return;

    try {
      const sponsorData = {
        ...sponsorForm,
        program_id: currentUser.program_id || 1, // Default to program 1 if not set
        created_by: currentUser.user_id,
      };

      if (isEditing && selectedSponsor) {
        await updateSponsorMutation.mutateAsync({
          ...sponsorData,
          sponsor_id: selectedSponsor.sponsor_id,
        });
      } else {
        await createSponsorMutation.mutateAsync(sponsorData);
      }

      refetchSponsors();
      setSponsorDialogOpen(false);
    } catch (error) {
      console.error('Error saving sponsor:', error);
    }
  };

  const handleSaveFund = async () => {
    if (!currentUser) return;

    try {
      const fundData = {
        ...fundForm,
        created_by: currentUser.user_id,
      };

      if (isEditing && selectedFund) {
        await updateFundMutation.mutateAsync({
          ...fundData,
          fund_id: selectedFund.fund_id,
        });
      } else {
        await createFundMutation.mutateAsync(fundData);
      }

      refetchFunds();
      setFundDialogOpen(false);
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  };

  if (!canManage) {
    return (
      <Alert severity="error">
        You do not have permission to access sponsor and fund management.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sponsor & Fund Management
      </Typography>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 'sponsors' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('sponsors')}
          sx={{ mr: 1 }}
          startIcon={<SponsorIcon />}
        >
          Sponsors
        </Button>
        <Button
          variant={activeTab === 'funds' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('funds')}
          startIcon={<FundIcon />}
        >
          Funds
        </Button>
      </Box>

      {/* Sponsors Tab */}
      {activeTab === 'sponsors' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Sponsors</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSponsor}>
              Add Sponsor
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Organization Type</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sponsors?.map((sponsor) => (
                  <TableRow key={sponsor.sponsor_id}>
                    <TableCell>{sponsor.sponsor_name}</TableCell>
                    <TableCell>{sponsor.sponsor_code}</TableCell>
                    <TableCell>{sponsor.organization_type || 'N/A'}</TableCell>
                    <TableCell>
                      {sponsor.primary_contact_name}
                      {sponsor.primary_contact_email && (
                        <>
                          <br />
                          <small>{sponsor.primary_contact_email}</small>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(sponsor.status)}
                        label={sponsor.status}
                        color={getStatusColor(sponsor.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditSponsor(sponsor)}>
                        <EditIcon />
                      </IconButton>
                      <Button size="small" onClick={() => handleCreateFund(sponsor.sponsor_id)}>
                        Add Fund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Funds Tab */}
      {activeTab === 'funds' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Sponsor Funds</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreateFund()}>
              Add Fund
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fund Name</TableCell>
                  <TableCell>Sponsor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Utilization</TableCell>
                  <TableCell>Expiration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sponsorFunds?.map((fund) => {
                  const utilizationPercent = (fund.allocated_amount / fund.total_amount) * 100;
                  const expirationStatus = fund.expiration_date
                    ? getExpirationStatus(fund.expiration_date)
                    : 'safe';
                  const daysUntilExpiration = fund.expiration_date
                    ? getDaysUntilExpiration(fund.expiration_date)
                    : null;

                  return (
                    <TableRow key={fund.fund_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {fund.fund_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fund.fund_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{fund.sponsor_name}</TableCell>
                      <TableCell>{fund.fund_type}</TableCell>
                      <TableCell>{formatCurrency(fund.total_amount)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={utilizationPercent}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {utilizationPercent.toFixed(0)}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(fund.remaining_amount)} remaining
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fund.expiration_date ? (
                          <Box>
                            <Typography variant="body2">
                              {formatDate(fund.expiration_date)}
                            </Typography>
                            {daysUntilExpiration !== null && (
                              <Chip
                                size="small"
                                label={
                                  daysUntilExpiration < 0
                                    ? 'Expired'
                                    : `${daysUntilExpiration} days`
                                }
                                color={
                                  expirationStatus === 'expired' || expirationStatus === 'critical'
                                    ? 'error'
                                    : expirationStatus === 'warning'
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            )}
                          </Box>
                        ) : (
                          'No expiration'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(fund.status)}
                          label={fund.status}
                          color={getStatusColor(fund.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditFund(fund)}>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Sponsor Dialog */}
      <Dialog
        open={sponsorDialogOpen}
        onClose={() => setSponsorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Sponsor' : 'Add New Sponsor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sponsor Name"
                value={sponsorForm.sponsor_name}
                onChange={(e) => setSponsorForm({ ...sponsorForm, sponsor_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sponsor Code"
                value={sponsorForm.sponsor_code}
                onChange={(e) => setSponsorForm({ ...sponsorForm, sponsor_code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization Type"
                value={sponsorForm.organization_type}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, organization_type: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={sponsorForm.status}
                  label="Status"
                  onChange={(e) =>
                    setSponsorForm({ ...sponsorForm, status: e.target.value as any })
                  }
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Contact Name"
                value={sponsorForm.primary_contact_name}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, primary_contact_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Contact Email"
                type="email"
                value={sponsorForm.primary_contact_email}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, primary_contact_email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Contact Phone"
                value={sponsorForm.primary_contact_phone}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, primary_contact_phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={sponsorForm.payment_terms}
                onChange={(e) => setSponsorForm({ ...sponsorForm, payment_terms: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Billing Address"
                multiline
                rows={2}
                value={sponsorForm.billing_address}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, billing_address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={sponsorForm.notes}
                onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSponsorDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSponsor} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fund Dialog */}
      <Dialog
        open={fundDialogOpen}
        onClose={() => setFundDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Fund' : 'Add New Fund'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fund Name"
                value={fundForm.fund_name}
                onChange={(e) => setFundForm({ ...fundForm, fund_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fund Code"
                value={fundForm.fund_code}
                onChange={(e) => setFundForm({ ...fundForm, fund_code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fund Type"
                value={fundForm.fund_type}
                onChange={(e) => setFundForm({ ...fundForm, fund_type: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={fundForm.total_amount}
                onChange={(e) =>
                  setFundForm({ ...fundForm, total_amount: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                value={fundForm.effective_date}
                onChange={(e) => setFundForm({ ...fundForm, effective_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiration Date"
                type="date"
                value={fundForm.expiration_date}
                onChange={(e) => setFundForm({ ...fundForm, expiration_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={fundForm.approval_status}
                  label="Approval Status"
                  onChange={(e) =>
                    setFundForm({ ...fundForm, approval_status: e.target.value as any })
                  }
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={fundForm.status}
                  label="Status"
                  onChange={(e) => setFundForm({ ...fundForm, status: e.target.value as any })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Exhausted">Exhausted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restrictions"
                multiline
                rows={2}
                value={fundForm.restrictions}
                onChange={(e) => setFundForm({ ...fundForm, restrictions: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reporting Requirements"
                multiline
                rows={2}
                value={fundForm.reporting_requirements}
                onChange={(e) =>
                  setFundForm({ ...fundForm, reporting_requirements: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={fundForm.notes}
                onChange={(e) => setFundForm({ ...fundForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFund} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SponsorFundManagement;
