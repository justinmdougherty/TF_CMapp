import React from 'react';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { FolderOpen, Inventory, Navigation, Article } from '@mui/icons-material';
import { SearchResult } from '../../types/Search';
import { useNavigate } from 'react-router';

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
  isSelected?: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onClick,
  isSelected = false,
}) => {
  const navigate = useNavigate();

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderOpen color="primary" />;
      case 'inventory':
        return <Inventory color="secondary" />;
      case 'navigation':
        return <Navigation color="action" />;
      default:
        return <Article color="action" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'primary';
      case 'inventory':
        return 'secondary';
      case 'navigation':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleClick = () => {
    onClick();
    if (result.url) {
      navigate(result.url);
    }
  };

  const formatMetadata = () => {
    if (!result.metadata) return null;

    const entries = Object.entries(result.metadata);
    if (entries.length === 0) return null;

    return entries
      .slice(0, 2)
      .map(([key, value]) => {
        if (key === 'current_stock_level' && typeof value === 'number') {
          return `Stock: ${value}`;
        }
        if (key === 'status') {
          return `Status: ${value}`;
        }
        if (key === 'project_type') {
          return `Type: ${value}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(' • ');
  };

  return (
    <ListItemButton
      onClick={handleClick}
      selected={isSelected}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 1,
        mb: 0.5,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&.Mui-selected': {
          backgroundColor: 'primary.50',
          '&:hover': {
            backgroundColor: 'primary.100',
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'transparent',
          }}
        >
          {getResultIcon(result.type)}
        </Avatar>
      </ListItemIcon>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {result.title}
            </Typography>
            <Chip
              label={result.category}
              size="small"
              color={getResultColor(result.type) as any}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3,
              }}
            >
              {result.description}
            </Typography>
            {formatMetadata() && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {formatMetadata()}
              </Typography>
            )}
          </Box>
        }
      />

      {result.score && (
        <Box sx={{ ml: 1, minWidth: 'fit-content' }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              fontSize: '0.7rem',
              fontFamily: 'monospace',
            }}
          >
            {Math.round(result.score)}%
          </Typography>
        </Box>
      )}
    </ListItemButton>
  );
};

export default SearchResultItem;
