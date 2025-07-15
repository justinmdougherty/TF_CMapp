import { FC, useContext } from 'react';
import { styled, Container, Box, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router';
import Header from './vertical/header/Header';
import Sidebar from './vertical/sidebar/Sidebar';
import Customizer from './shared/customizer/Customizer';
import Navigation from '../full/horizontal/navbar/Navigation';
import HorizontalHeader from '../full/horizontal/header/Header';
import ScrollToTop from '../../components/shared/ScrollToTop';
import LoadingBar from '../../LoadingBar';
import CartDrawer from '../../components/shared/CartDrawer';
import { CustomizerContext } from 'src/context/CustomizerContext';
import config from 'src/context/config';

const MainWrapper = styled('div')(() => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '60px',
  flexDirection: 'column',
  zIndex: 1,
  backgroundColor: 'transparent',
}));

const FullLayout: FC = () => {
  const { activeLayout, isLayout, activeMode, isCollapse } = useContext(CustomizerContext);
  const MiniSidebarWidth = config.miniSidebarWidth;
  const location = useLocation();

  // Check if we're on a data-heavy page that needs wider container
  const isDataHeavyPage =
    location.pathname.includes('/project/') || // Fixed: route is /project/:id not /project-detail
    location.pathname.includes('/batch-tracking') ||
    location.pathname.includes('/inventory');

  // Determine container max width based on layout and page type
  const getContainerMaxWidth = () => {
    if (isLayout === 'full') return '100%!important';
    if (isDataHeavyPage) {
      // For data-heavy pages in boxed mode, use a much wider container
      // This should give roughly 2/3 of typical screen width
      return 'min(90vw, 1800px)';
    }
    return 'xl'; // Standard boxed width (1320px)
  };

  const theme = useTheme();

  return (
    <>
      <LoadingBar />

      <MainWrapper className={activeMode === 'dark' ? 'darkbg mainwrapper' : 'mainwrapper'}>
        {/* ------------------------------------------- */}
        {/* Sidebar */}
        {/* ------------------------------------------- */}
        {activeLayout === 'horizontal' ? '' : <Sidebar />}
        {/* ------------------------------------------- */}
        {/* Main Wrapper */}
        {/* ------------------------------------------- */}
        <PageWrapper
          className="page-wrapper"
          sx={{
            ...(isCollapse === 'mini-sidebar' && {
              [theme.breakpoints.up('lg')]: { ml: `${MiniSidebarWidth}px` },
            }),
          }}
        >
          {/* ------------------------------------------- */}
          {/* Header */}
          {/* ------------------------------------------- */}
          {activeLayout === 'horizontal' ? <HorizontalHeader /> : <Header />}
          {/* PageContent */}
          {activeLayout === 'horizontal' ? <Navigation /> : ''}
          {isDataHeavyPage ? (
            // Use a custom Box instead of Container for data-heavy pages
            <Box
              sx={{
                maxWidth: getContainerMaxWidth(),
                width: '100%',
                mx: 'auto', // Center the content
                px: isLayout === 'boxed' ? 3 : 2,
              }}
            >
              <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
                <ScrollToTop>
                  <Outlet />
                </ScrollToTop>
              </Box>
            </Box>
          ) : (
            <Container
              sx={{
                maxWidth: getContainerMaxWidth(),
                px: isLayout === 'boxed' ? 3 : 2,
              }}
            >
              {/* ------------------------------------------- */}
              {/* PageContent */}
              {/* ------------------------------------------- */}
              <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
                <ScrollToTop>
                  <Outlet />
                </ScrollToTop>
              </Box>
              {/* ------------------------------------------- */}
              {/* End Page */}
              {/* ------------------------------------------- */}
            </Container>
          )}
          <Customizer />
          <CartDrawer />
        </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default FullLayout;
