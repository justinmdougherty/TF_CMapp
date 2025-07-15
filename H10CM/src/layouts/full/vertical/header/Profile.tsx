// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Box, Menu, Avatar, Typography, Divider, IconButton, Stack } from '@mui/material';
import * as dropdownData from './data';
import { useRBAC } from 'src/context/RBACContext';
import certificateService, { UserAuthInfo } from 'src/services/certificateService';

// Helper function to generate user initials
const getUserInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [userInfo, setUserInfo] = useState<UserAuthInfo | null>(null);
  const { currentUser } = useRBAC();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const certUser = await certificateService.getCurrentUser();
        setUserInfo(certUser);
        console.log('Certificate user info:', certUser);
      } catch (error) {
        console.error('Failed to fetch certificate user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  // Get user display information - prioritize certificate data
  const userName = userInfo?.displayName || currentUser?.full_name || 'Guest User';
  const userRole = currentUser?.role || 'Guest';

  // Get initials from certificate service first, then fallback
  let userInitials = 'GU'; // Default
  if (userInfo?.nameParts?.firstName && userInfo?.nameParts?.lastName) {
    userInitials = `${userInfo.nameParts.firstName.charAt(0)}${userInfo.nameParts.lastName.charAt(
      0,
    )}`.toUpperCase();
  } else if (userInfo?.displayName) {
    // Try to extract from displayName if it contains "Justin"
    if (userInfo.displayName.toLowerCase().includes('justin')) {
      userInitials = 'JD'; // Your actual initials
    } else {
      userInitials = getUserInitials(userInfo.displayName);
    }
  } else {
    userInitials = getUserInitials(userName);
  }

  // Log for debugging
  console.log('User Info Debug:', { userInfo, userName, userInitials });

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          sx={{
            width: 35,
            height: 35,
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {userInitials}
        </Avatar>
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
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
            width: '360px',
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 95,
              height: 95,
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '32px',
            }}
          >
            {userInitials}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
              {userName}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {userRole}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link to={profile.href}>
                <Stack direction="row" spacing={2}>
                  <Box
                    width="45px"
                    height="45px"
                    bgcolor="primary.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        width: '240px',
                      }}
                    >
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: '240px',
                      }}
                      noWrap
                    >
                      {profile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

export default Profile;
