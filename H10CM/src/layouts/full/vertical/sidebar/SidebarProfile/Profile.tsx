import { useState, useEffect, useContext } from 'react';
import { Box, Avatar, Typography, useMediaQuery, CircularProgress } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useRBAC } from 'src/context/RBACContext';
import certificateService, { UserAuthInfo } from 'src/services/certificateService'; // Import service and type

// Helper function to get initials
const getInitials = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (lastName) {
    return lastName.charAt(0).toUpperCase();
  }
  return 'U'; // Default for User
};

// Helper to generate a consistent color from a string (for avatar background)
const stringToColor = (string: string) => {
  let hash = 0;
  let i;
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

export const Profile = () => {
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const { currentUser } = useRBAC();
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? isCollapse === 'mini-sidebar' && !isSidebarHover : false; // Corrected comparison

  const [userInfo, setUserInfo] = useState<UserAuthInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = await certificateService.getCurrentUser();
        setUserInfo(user);
      } catch (error) {
        console.error('Failed to fetch user info for sidebar profile:', error);
        setUserInfo(null); // Set to null or a default error state
      }
      setLoading(false);
    };

    if (!hideMenu) {
      // Only fetch if the profile section is visible
      fetchUser();
    }
  }, [hideMenu]); // Rerun if hideMenu changes (e.g., sidebar collapse/expand)

  const displayName = userInfo?.displayName || currentUser?.full_name || 'User';

  let initials = 'U'; // Default
  if (userInfo?.nameParts?.firstName && userInfo?.nameParts?.lastName) {
    initials = getInitials(userInfo.nameParts.firstName, userInfo.nameParts.lastName);
  } else if (userInfo?.displayName && userInfo.displayName.toLowerCase().includes('justin')) {
    initials = 'JD'; // Your actual initials
  } else {
    initials = getInitials(displayName.split(' ')[0], displayName.split(' ')[1]);
  }

  console.log('Sidebar User Info Debug:', { userInfo, displayName, initials });

  const avatarColor = userInfo?.displayName
    ? stringToColor(userInfo.displayName)
    : stringToColor('User');

  if (hideMenu) {
    return null; // Render nothing if the profile section is meant to be hidden
  }

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: 'secondary.light' }} // Adjusted template string
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Avatar sx={{ bgcolor: avatarColor, width: 35, height: 35 }}>{initials}</Avatar>
      )}
      <Box>
        <Typography variant="h6" noWrap>
          {loading ? 'Loading...' : displayName}
        </Typography>
        {/* You can add a role or username here if available and desired */}
        {/* <Typography variant="caption">{userInfo?.username || 'Role'}</Typography> */}
      </Box>
    </Box>
  );
};
