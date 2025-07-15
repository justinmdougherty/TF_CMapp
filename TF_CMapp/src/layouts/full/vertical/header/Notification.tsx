// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Tooltip,
  IconButton as MuiIconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  Circle as UnreadIcon,
} from '@mui/icons-material';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import smartNotifications from 'src/services/smartNotificationService';
import { NotificationItem } from 'src/types/Notifications';
import { Link, useNavigate } from 'react-router';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { IconBellRinging } from '@tabler/icons-react';

const Notifications = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = smartNotifications.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Initial load
    setNotifications(smartNotifications.getNotifications({ limit: 10 }));

    return unsubscribe;
  }, []);

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    smartNotifications.markAsRead(notificationId);
  };

  const handleDelete = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    smartNotifications.deleteNotification(notificationId);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      smartNotifications.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleClose2();
    }
  };

  const handleMarkAllAsRead = () => {
    smartNotifications.markAllAsRead();
  };

  const getNotificationIcon = (notification: NotificationItem) => {
    if (notification.icon) {
      return notification.icon;
    }

    switch (notification.type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'critical':
        return '🚨';
      case 'reminder':
        return '⏰';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
      case 'critical':
        return '#f44336';
      case 'reminder':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const summary = smartNotifications.getSummary();
  const unreadCount = summary.unread;

  return (
    <Box>
      <IconButton
        size="large"
        aria-label={`show ${unreadCount} new notifications`}
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          color: anchorEl2 ? 'primary.main' : 'text.secondary',
        }}
        onClick={handleClick2}
      >
        <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="primary">
          <IconBellRinging size="21" stroke="1.5" />
        </Badge>
      </IconButton>

      {/* Notifications Dropdown */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '400px',
            maxHeight: '500px',
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" py={2} px={3} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notifications</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {unreadCount > 0 && <Chip label={`${unreadCount} new`} color="primary" size="small" />}
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <MuiIconButton size="small" onClick={handleMarkAllAsRead}>
                  <CheckIcon fontSize="small" />
                </MuiIconButton>
              </Tooltip>
            )}
          </Box>
        </Stack>

        <Divider />

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <Scrollbar sx={{ height: '350px' }}>
            {notifications.map((notification) => (
              <Box key={notification.id}>
                <MenuItem
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    {/* Icon/Avatar */}
                    <Box sx={{ position: 'relative' }}>
                      {notification.avatar ? (
                        <Avatar src={notification.avatar} sx={{ width: 40, height: 40 }} />
                      ) : (
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: getNotificationColor(notification),
                            fontSize: '1.2rem',
                          }}
                        >
                          {getNotificationIcon(notification)}
                        </Avatar>
                      )}
                      {!notification.isRead && (
                        <UnreadIcon
                          sx={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            color: 'primary.main',
                            fontSize: '12px',
                          }}
                        />
                      )}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={notification.isRead ? 400 : 600}
                        noWrap
                        sx={{ mb: 0.5 }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack direction="column" spacing={0.5}>
                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <MuiIconButton
                            size="small"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                          >
                            <CheckIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                      )}
                      {notification.actionUrl && (
                        <Tooltip title="Open">
                          <MuiIconButton size="small">
                            <LaunchIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <MuiIconButton
                          size="small"
                          onClick={(e) => handleDelete(notification.id, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </MuiIconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </MenuItem>
                <Divider variant="inset" component="li" />
              </Box>
            ))}
          </Scrollbar>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box p={2}>
          <Button to="/notifications" variant="outlined" component={Link} color="primary" fullWidth>
            See all Notifications
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Notifications;
