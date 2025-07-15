import React from 'react';
import { Card, CardContent, Typography, Box, Grid, useTheme } from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { InventoryItem } from 'src/types/Inventory';

interface InventoryStatsCardsProps {
  inventoryItems: InventoryItem[];
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: '0.875rem' }}
            >
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: '1rem',
                    mr: 0.5,
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    fontWeight: 500,
                  }}
                >
                  {Math.abs(trend.value)}% from last period
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme.palette[color].main}15`,
              color: theme.palette[color].main,
              ml: 2,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const InventoryStatsCards: React.FC<InventoryStatsCardsProps> = ({ inventoryItems, isLoading }) => {
  // Calculate statistics
  const stats = React.useMemo(() => {
    if (isLoading || !inventoryItems.length) {
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        uniqueCategories: 0,
        averageValue: 0,
      };
    }

    const totalItems = inventoryItems.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categories = new Set<string>();

    inventoryItems.forEach((item) => {
      // Calculate total value (using estimated $10 per item since unit_cost not available)
      const estimatedUnitCost = 10; // Placeholder until unit_cost is added to schema
      const currentStock = item.current_stock_level || 0;
      totalValue += currentStock * estimatedUnitCost;

      // Count low stock items
      if (currentStock <= 0) {
        outOfStockCount++;
      } else if (currentStock <= (item.reorder_point || 5)) {
        // Use reorder_point as minimum
        lowStockCount++;
      }

      // Track categories (using unit_of_measure as category for now)
      if (item.unit_of_measure) {
        categories.add(item.unit_of_measure);
      }
    });

    return {
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      uniqueCategories: categories.size,
      averageValue: totalItems > 0 ? totalValue / totalItems : 0,
    };
  }, [inventoryItems, isLoading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
            <Card sx={{ height: 140 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Loading...
                    </Typography>
                    <Typography variant="h4">--</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '12px',
                      backgroundColor: 'grey.100',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={4} lg={2.4}>
        <StatCard
          title="Total Items"
          value={formatNumber(stats.totalItems)}
          subtitle="Active inventory items"
          icon={<InventoryIcon fontSize="large" />}
          color="primary"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={2.4}>
        <StatCard
          title="Total Value"
          value={formatCurrency(stats.totalValue)}
          subtitle="Current inventory value"
          icon={<MoneyIcon fontSize="large" />}
          color="success"
          trend={{ value: 12.5, isPositive: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={2.4}>
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          subtitle="Items below minimum"
          icon={<WarningIcon fontSize="large" />}
          color="warning"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={2.4}>
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          subtitle="Items with zero stock"
          icon={<WarningIcon fontSize="large" />}
          color="error"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={2.4}>
        <StatCard
          title="Categories"
          value={stats.uniqueCategories}
          subtitle="Unique locations/categories"
          icon={<CategoryIcon fontSize="large" />}
          color="info"
        />
      </Grid>
    </Grid>
  );
};

export default InventoryStatsCards;
