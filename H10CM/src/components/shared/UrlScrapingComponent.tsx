import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Collapse,
  IconButton,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useVendorScraping } from '../../hooks/useVendorScraping';
import { ScrapedItemData } from '../../services/vendorScrapingService';

interface UrlScrapingComponentProps {
  onDataScraped: (data: ScrapedItemData) => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showSupportedVendors?: boolean;
}

const UrlScrapingComponent: React.FC<UrlScrapingComponentProps> = ({
  onDataScraped,
  onClear,
  disabled = false,
  placeholder = 'Enter product URL (Digi-Key, McMaster-Carr, Mouser, etc.)',
  showSupportedVendors = true,
}) => {
  const [url, setUrl] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const { scrapedData, isLoading, error, scrapeUrl, clearData } = useVendorScraping();

  const supportedVendors = [
    'Digi-Key',
    'McMaster-Carr',
    'Mouser',
    'Arrow',
    'Grainger',
    'Amazon Business',
  ];

  const handleScrape = async () => {
    if (!url.trim()) return;

    await scrapeUrl(url);
  };

  const handleApplyData = () => {
    if (scrapedData && scrapedData.success) {
      onDataScraped(scrapedData);
      // Optionally clear the component after applying
      // handleClear();
    }
  };

  const handleClear = () => {
    setUrl('');
    clearData();
    setShowDetails(false);
    onClear?.();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleScrape();
    }
  };

  const getVendorChipColor = (vendor: string) => {
    const colors: Record<
      string,
      'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
    > = {
      'Digi-Key': 'error',
      'McMaster-Carr': 'primary',
      Mouser: 'info',
      Arrow: 'secondary',
      Grainger: 'success',
      'Amazon Business': 'warning',
    };
    return colors[vendor] || 'default';
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon color="primary" />
        Import from URL
        <Tooltip title="Automatically fill product details from vendor websites">
          <InfoIcon fontSize="small" color="action" />
        </Tooltip>
      </Typography>

      {showSupportedVendors && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Supported vendors:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {supportedVendors.map((vendor) => (
              <Chip
                key={vendor}
                label={vendor}
                size="small"
                color={getVendorChipColor(vendor)}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          error={!!error && !isLoading}
          InputProps={{
            endAdornment: url && (
              <IconButton size="small" onClick={() => setUrl('')} disabled={isLoading}>
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleScrape}
          disabled={!url.trim() || !isValidUrl(url) || isLoading || disabled}
          startIcon={isLoading ? <CircularProgress size={16} /> : <SearchIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {isLoading ? 'Scraping...' : 'Import'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">{error}</Typography>
            <Button size="small" onClick={clearData}>
              Dismiss
            </Button>
          </Box>
        </Alert>
      )}

      {scrapedData && scrapedData.success && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="subtitle2" color="success.dark">
                Product data imported successfully
              </Typography>
            </Box>
            <Box>
              <Button size="small" onClick={() => setShowDetails(!showDetails)} sx={{ mr: 1 }}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleApplyData}
                sx={{ mr: 1 }}
              >
                Apply Data
              </Button>
              <IconButton size="small" onClick={handleClear}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Name:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {scrapedData.item_name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Part Number:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {scrapedData.part_number}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Description:
              </Typography>
              <Typography variant="body2">{scrapedData.description}</Typography>
            </Grid>
          </Grid>

          <Collapse in={showDetails}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'success.dark' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Supplier:
                  </Typography>
                  <Typography variant="body2">{scrapedData.supplier}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Unit of Measure:
                  </Typography>
                  <Typography variant="body2">{scrapedData.unit_of_measure}</Typography>
                </Grid>
                {scrapedData.estimated_cost && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Cost:
                    </Typography>
                    <Typography variant="body2">
                      ${scrapedData.estimated_cost.toFixed(2)}
                    </Typography>
                  </Grid>
                )}
                {scrapedData.package_size && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Package Size:
                    </Typography>
                    <Typography variant="body2">{scrapedData.package_size}</Typography>
                  </Grid>
                )}
                {scrapedData.datasheet_url && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Datasheet:
                    </Typography>
                    <Link
                      href={scrapedData.datasheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      View Datasheet <LaunchIcon fontSize="small" />
                    </Link>
                  </Grid>
                )}
                {scrapedData.specifications &&
                  Object.keys(scrapedData.specifications).length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Specifications:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(scrapedData.specifications).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}

      {scrapedData && !scrapedData.success && scrapedData.error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Could not automatically import product data: {scrapedData.error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please enter the product details manually.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default UrlScrapingComponent;
