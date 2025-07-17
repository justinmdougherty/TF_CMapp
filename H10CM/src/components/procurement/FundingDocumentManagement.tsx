import React, { useState, useCallback } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as FundIcon,
  Business as SponsorIcon,
  Warning as WarningIcon,
  Description as DocumentIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assignment as TaskIcon,
  CloudUpload as CloudUploadIcon,
  SwapHoriz,
} from '@mui/icons-material';
import {
  useSponsors,
  useCreateSponsor,
  useUpdateSponsor,
  useSponsorFunds,
  useCreateSponsorFund,
  useUpdateSponsorFund,
  useFundingDocuments,
  useCreateFundingDocument,
  useUpdateFundingDocument,
  useDeleteFundingDocument,
  useUploadFundingDocument,
  useDownloadFundingDocument,
  useExpiringDocuments,
  useTaskFundAllocations,
} from '../../hooks/api/useProcurementHooks';
import type { Sponsor, SponsorFund, FundingDocument } from '../../types/ProcurementTypes';
import { useRBAC } from '../../context/RBACContext';

const FundingDocumentManagement: React.FC = () => {
  const { currentUser, hasRole } = useRBAC();

  // Data fetching
  const { data: sponsors = [], isLoading: sponsorsLoading } = useSponsors();
  const { data: funds = [], isLoading: fundsLoading } = useSponsorFunds();
  const { data: documents = [], isLoading: documentsLoading } = useFundingDocuments();
  const { data: expiringDocs = [] } = useExpiringDocuments(30);
  const { data: taskAllocations = [] } = useTaskFundAllocations();

  // Mutations
  const createSponsorMutation = useCreateSponsor();
  const updateSponsorMutation = useUpdateSponsor();
  const createFundMutation = useCreateSponsorFund();
  const updateFundMutation = useUpdateSponsorFund();
  const createDocumentMutation = useCreateFundingDocument();
  const updateDocumentMutation = useUpdateFundingDocument();
  const deleteDocumentMutation = useDeleteFundingDocument();
  const uploadDocumentMutation = useUploadFundingDocument();
  const downloadDocumentMutation = useDownloadFundingDocument();

  // State management
  const [activeTab, setActiveTab] = useState<'sponsors' | 'funds' | 'documents' | 'tasks'>(
    'sponsors',
  );
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [selectedFund, setSelectedFund] = useState<SponsorFund | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<FundingDocument | null>(null);
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [sponsorForm, setSponsorForm] = useState<Partial<Sponsor>>({
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

  const [fundForm, setFundForm] = useState<Partial<SponsorFund>>({
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

  const [documentForm, setDocumentForm] = useState<Partial<FundingDocument>>({
    document_name: '',
    document_number: '',
    document_type: '',
    contract_amount: 0,
    effective_date: '',
    expiration_date: '',
    status: 'Active',
    legal_reference: '',
    compliance_requirements: '',
    renewal_terms: '',
    termination_conditions: '',
    notes: '',
  });

  // Utility functions
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiration = (expirationDate: string | undefined) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'default';
      case 'Expired':
        return 'error';
      case 'Expiring':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Event handlers
  const handleSponsorSubmit = useCallback(async () => {
    try {
      if (isEditing && selectedSponsor) {
        await updateSponsorMutation.mutateAsync({
          ...selectedSponsor,
          ...sponsorForm,
        });
      } else {
        await createSponsorMutation.mutateAsync({
          ...sponsorForm,
          program_id: 1, // Use default program for now
          created_by: parseInt(currentUser?.user_id || '1'),
        } as Omit<Sponsor, 'sponsor_id' | 'created_date'>);
      }
      setSponsorDialogOpen(false);
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
    } catch (error) {
      console.error('Error saving sponsor:', error);
    }
  }, [
    isEditing,
    selectedSponsor,
    sponsorForm,
    currentUser,
    createSponsorMutation,
    updateSponsorMutation,
  ]);

  const handleFundSubmit = useCallback(async () => {
    try {
      if (isEditing && selectedFund) {
        await (updateFundMutation.mutateAsync as any)({
          ...selectedFund,
          ...fundForm,
        });
      } else {
        await (createFundMutation.mutateAsync as any)({
          ...fundForm,
          sponsor_id: selectedSponsor?.sponsor_id || 1,
          allocated_amount: 0,
          spent_amount: 0,
          remaining_amount: fundForm.total_amount || 0,
          created_by: parseInt(currentUser?.user_id || '1'),
        } as Omit<SponsorFund, 'fund_id' | 'created_date'>);
      }
      setFundDialogOpen(false);
      setSelectedFund(null);
      setFundForm({
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
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  }, [
    isEditing,
    selectedFund,
    fundForm,
    selectedSponsor,
    currentUser,
    createFundMutation,
    updateFundMutation,
  ]);

  const handleDocumentSubmit = useCallback(async () => {
    try {
      if (isEditing && selectedDocument) {
        await (updateDocumentMutation.mutateAsync as any)({
          ...selectedDocument,
          ...documentForm,
        });
      } else {
        await (createDocumentMutation.mutateAsync as any)({
          ...documentForm,
          sponsor_id: selectedSponsor?.sponsor_id || 1,
          fund_id: selectedFund?.fund_id,
          uploaded_by: parseInt(currentUser?.user_id || '1'),
        } as Omit<FundingDocument, 'document_id' | 'created_date' | 'upload_date'>);
      }
      setDocumentDialogOpen(false);
      setSelectedDocument(null);
      setDocumentForm({
        document_name: '',
        document_number: '',
        document_type: '',
        contract_amount: 0,
        effective_date: '',
        expiration_date: '',
        status: 'Active',
        legal_reference: '',
        compliance_requirements: '',
        renewal_terms: '',
        termination_conditions: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }, [
    isEditing,
    selectedDocument,
    documentForm,
    selectedSponsor,
    selectedFund,
    currentUser,
    createDocumentMutation,
    updateDocumentMutation,
  ]);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await uploadDocumentMutation.mutateAsync({
        file: selectedFile,
        metadata: {
          ...documentForm,
          sponsor_id: selectedSponsor?.sponsor_id || 1,
          fund_id: selectedFund?.fund_id,
          uploaded_by: parseInt(currentUser?.user_id || '1'),
        },
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentForm({
        document_name: '',
        document_number: '',
        document_type: '',
        contract_amount: 0,
        effective_date: '',
        expiration_date: '',
        status: 'Active',
        legal_reference: '',
        compliance_requirements: '',
        renewal_terms: '',
        termination_conditions: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  }, [
    selectedFile,
    documentForm,
    selectedSponsor,
    selectedFund,
    currentUser,
    uploadDocumentMutation,
  ]);

  const handleDownloadDocument = useCallback(
    async (documentId: number, fileName: string) => {
      try {
        const blob = await (downloadDocumentMutation.mutateAsync as any)(documentId);
        const url = window.URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading document:', error);
      }
    },
    [downloadDocumentMutation],
  );

  const handleDeleteDocument = useCallback(
    async (documentId: number) => {
      if (window.confirm('Are you sure you want to delete this document?')) {
        try {
          await (deleteDocumentMutation.mutateAsync as any)(documentId);
        } catch (error) {
          console.error('Error deleting document:', error);
        }
      }
    },
    [deleteDocumentMutation],
  );

  // Render functions
  const renderSponsorTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Sponsors</Typography>
        {hasRole('Admin') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setIsEditing(false);
              setSelectedSponsor(null);
              setSponsorDialogOpen(true);
            }}
          >
            Add Sponsor
          </Button>
        )}
      </Box>

      {sponsorsLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {(sponsors as Sponsor[]).map((sponsor) => (
            <Grid item xs={12} md={6} key={sponsor.sponsor_id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {sponsor.sponsor_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Code: {sponsor.sponsor_code}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Type: {sponsor.organization_type}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Contact: {sponsor.primary_contact_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Email: {sponsor.primary_contact_email}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Phone: {sponsor.primary_contact_phone}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 1,
                      }}
                    >
                      <Chip
                        label={sponsor.status}
                        color={getStatusColor(sponsor.status) as any}
                        size="small"
                      />
                      {hasRole('Admin') && (
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSponsor(sponsor);
                              setSponsorForm(sponsor);
                              setIsEditing(true);
                              setSponsorDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSponsor(sponsor);
                              setActiveTab('funds');
                            }}
                          >
                            <FundIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderFundsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Sponsor Funds</Typography>
        {hasRole('Admin') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setIsEditing(false);
              setSelectedFund(null);
              setFundDialogOpen(true);
            }}
          >
            Add Fund
          </Button>
        )}
      </Box>

      {fundsLoading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fund Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Sponsor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Remaining</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>Expiration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(funds as SponsorFund[]).map((fund) => {
                const daysUntilExpiration = getDaysUntilExpiration(fund.expiration_date);
                const isExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 30;

                return (
                  <TableRow key={fund.fund_id}>
                    <TableCell>{fund.fund_name}</TableCell>
                    <TableCell>{fund.fund_code}</TableCell>
                    <TableCell>{fund.sponsor_name}</TableCell>
                    <TableCell>{fund.fund_type}</TableCell>
                    <TableCell>{formatCurrency(fund.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(fund.remaining_amount)}</TableCell>
                    <TableCell>{formatDate(fund.effective_date)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {formatDate(fund.expiration_date)}
                        {isExpiring && (
                          <Tooltip title={`Expires in ${daysUntilExpiration} days`}>
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fund.status}
                        color={getStatusColor(fund.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedFund(fund);
                          setFundForm(fund);
                          setIsEditing(true);
                          setFundDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedFund(fund);
                          setActiveTab('documents');
                        }}
                      >
                        <DocumentIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderDocumentsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Funding Documents</Typography>
        {hasRole('Admin') && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Document
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditing(false);
                setSelectedDocument(null);
                setDocumentDialogOpen(true);
              }}
            >
              Add Document
            </Button>
          </Stack>
        )}
      </Box>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {expiringDocs.length} document(s) expiring within 30 days
          </Typography>
          <List dense>
            {(expiringDocs as FundingDocument[]).slice(0, 3).map((doc) => (
              <ListItem key={doc.document_id}>
                <ListItemText
                  primary={doc.document_name}
                  secondary={`Expires: ${formatDate(doc.expiration_date)}`}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {documentsLoading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document Name</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sponsor</TableCell>
                <TableCell>Fund</TableCell>
                <TableCell>Contract Amount</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>Expiration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(documents as FundingDocument[]).map((document) => {
                const daysUntilExpiration = getDaysUntilExpiration(document.expiration_date);
                const isExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 30;

                return (
                  <TableRow key={document.document_id}>
                    <TableCell>{document.document_name}</TableCell>
                    <TableCell>{document.document_number}</TableCell>
                    <TableCell>{document.document_type}</TableCell>
                    <TableCell>{document.sponsor_name}</TableCell>
                    <TableCell>{document.fund_name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(document.contract_amount)}</TableCell>
                    <TableCell>{formatDate(document.effective_date)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {formatDate(document.expiration_date)}
                        {isExpiring && (
                          <Tooltip title={`Expires in ${daysUntilExpiration} days`}>
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={document.status}
                        color={getStatusColor(document.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedDocument(document);
                          setDocumentForm(document);
                          setIsEditing(true);
                          setDocumentDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {document.document_path && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDownloadDocument(document.document_id, document.document_name)
                          }
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDocument(document.document_id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderTasksTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Task Fund Allocations
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        View and manage fund allocations to production tasks
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Fund</TableCell>
              <TableCell>Sponsor</TableCell>
              <TableCell>Allocated Amount</TableCell>
              <TableCell>Spent Amount</TableCell>
              <TableCell>Remaining</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Cross Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(taskAllocations as any[]).map((allocation) => (
              <TableRow key={allocation.allocation_id}>
                <TableCell>{allocation.task_title}</TableCell>
                <TableCell>{allocation.fund_name}</TableCell>
                <TableCell>{allocation.sponsor_name}</TableCell>
                <TableCell>{formatCurrency(allocation.allocation_amount)}</TableCell>
                <TableCell>{formatCurrency(allocation.spent_amount)}</TableCell>
                <TableCell>{formatCurrency(allocation.remaining_amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={allocation.status}
                    color={getStatusColor(allocation.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {allocation.is_cross_payment ? (
                    <Chip
                      label={`${allocation.cross_payment_sponsor_name}`}
                      color="info"
                      size="small"
                      icon={<SwapHoriz />}
                    />
                  ) : (
                    'No'
                  )}
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SponsorIcon />
                Sponsors
              </Box>
            }
            value="sponsors"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FundIcon />
                Funds
                {expiringDocs.length > 0 && (
                  <Badge badgeContent={expiringDocs.length} color="warning" />
                )}
              </Box>
            }
            value="funds"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon />
                Documents
              </Box>
            }
            value="documents"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TaskIcon />
                Tasks
              </Box>
            }
            value="tasks"
          />
        </Tabs>
      </Box>

      {activeTab === 'sponsors' && renderSponsorTab()}
      {activeTab === 'funds' && renderFundsTab()}
      {activeTab === 'documents' && renderDocumentsTab()}
      {activeTab === 'tasks' && renderTasksTab()}

      {/* Sponsor Dialog */}
      <Dialog
        open={sponsorDialogOpen}
        onClose={() => setSponsorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Sponsor' : 'Add New Sponsor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
                label="Tax ID"
                value={sponsorForm.tax_id}
                onChange={(e) => setSponsorForm({ ...sponsorForm, tax_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Billing Address"
                multiline
                rows={3}
                value={sponsorForm.billing_address}
                onChange={(e) =>
                  setSponsorForm({ ...sponsorForm, billing_address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
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
          <Button
            onClick={handleSponsorSubmit}
            variant="contained"
            disabled={createSponsorMutation.isPending || updateSponsorMutation.isPending}
          >
            {createSponsorMutation.isPending || updateSponsorMutation.isPending ? (
              <CircularProgress size={20} />
            ) : isEditing ? (
              'Update'
            ) : (
              'Create'
            )}
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
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
              <FormControl fullWidth>
                <InputLabel>Sponsor</InputLabel>
                <Select
                  value={selectedSponsor?.sponsor_id || ''}
                  onChange={(e) => {
                    const sponsor = (sponsors as Sponsor[]).find(
                      (s) => s.sponsor_id === e.target.value,
                    );
                    setSelectedSponsor(sponsor || null);
                  }}
                >
                  {(sponsors as Sponsor[]).map((sponsor) => (
                    <MenuItem key={sponsor.sponsor_id} value={sponsor.sponsor_id}>
                      {sponsor.sponsor_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fund Type"
                value={fundForm.fund_type}
                onChange={(e) => setFundForm({ ...fundForm, fund_type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={fundForm.total_amount}
                onChange={(e) => setFundForm({ ...fundForm, total_amount: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={fundForm.status}
                  onChange={(e) => setFundForm({ ...fundForm, status: e.target.value as any })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Exhausted">Exhausted</MenuItem>
                </Select>
              </FormControl>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restrictions"
                multiline
                rows={3}
                value={fundForm.restrictions}
                onChange={(e) => setFundForm({ ...fundForm, restrictions: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reporting Requirements"
                multiline
                rows={3}
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
          <Button
            onClick={handleFundSubmit}
            variant="contained"
            disabled={createFundMutation.isPending || updateFundMutation.isPending}
          >
            {createFundMutation.isPending || updateFundMutation.isPending ? (
              <CircularProgress size={20} />
            ) : isEditing ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Dialog */}
      <Dialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Document' : 'Add New Document'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Name"
                value={documentForm.document_name}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, document_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Number"
                value={documentForm.document_number}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, document_number: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Type"
                value={documentForm.document_type}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, document_type: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contract Amount"
                type="number"
                value={documentForm.contract_amount}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, contract_amount: Number(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                value={documentForm.effective_date}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, effective_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiration Date"
                type="date"
                value={documentForm.expiration_date}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, expiration_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={documentForm.status}
                  onChange={(e) =>
                    setDocumentForm({ ...documentForm, status: e.target.value as any })
                  }
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Superseded">Superseded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Legal Reference"
                value={documentForm.legal_reference}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, legal_reference: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Compliance Requirements"
                multiline
                rows={3}
                value={documentForm.compliance_requirements}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, compliance_requirements: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Renewal Terms"
                multiline
                rows={3}
                value={documentForm.renewal_terms}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, renewal_terms: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Termination Conditions"
                multiline
                rows={3}
                value={documentForm.termination_conditions}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, termination_conditions: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDocumentSubmit}
            variant="contained"
            disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
          >
            {createDocumentMutation.isPending || updateDocumentMutation.isPending ? (
              <CircularProgress size={20} />
            ) : isEditing ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Funding Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>

            {selectedFile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Selected: {selectedFile.name}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Document Name"
              value={documentForm.document_name}
              onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Document Number"
              value={documentForm.document_number}
              onChange={(e) =>
                setDocumentForm({ ...documentForm, document_number: e.target.value })
              }
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Document Type"
              value={documentForm.document_type}
              onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={!selectedFile || uploadDocumentMutation.isPending}
          >
            {uploadDocumentMutation.isPending ? <CircularProgress size={20} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundingDocumentManagement;
