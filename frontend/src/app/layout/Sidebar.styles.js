import { styled } from '@mui/material/styles';
import { Box, ListItemButton, Typography } from '@mui/material';
import { designTokens } from '../theme/theme';

/**
 * Filter props that shouldn't reach the DOM
 */
const shouldForwardProp = (prop) => !['selected', 'item', 'primaryTypographyProps', 'FormHelperTextProps'].includes(prop);

export const SidebarContainer = styled(Box, { shouldForwardProp })(({ theme }) => ({
    width: theme.layout?.sidebarWidth || 320,
    height: '100%',
    /**
     * Light mode: brand primary blue (#1976D2).
     * Dark mode: design system surface colour (#161B22) for proper dark nav panel.
     */
    backgroundColor: theme.palette.mode === 'dark'
        ? designTokens.dark.surface
        : theme.palette.primary.main,
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overflowX: 'hidden',
    flexShrink: 0,
    borderRadius: 0,
    boxSizing: 'border-box',
    transition: theme.transitions.create(['width', 'background-color'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
}));

export const ProfileSection = styled(Box, { shouldForwardProp })(({ theme }) => ({
    padding: theme.spacing(3.4, 3, 5.1, 3),
    textAlign: 'center',
    boxSizing: 'border-box',
    borderRadius: 0,
}));

export const ProfileName = styled(Typography, { shouldForwardProp })(({ theme }) => ({
    fontWeight: 500,
    marginBottom: theme.spacing(0.85),
    fontSize: '1.48rem',
    lineHeight: 1.2,
    color: 'white',
    borderRadius: 0,
}));

export const ProfileRole = styled(Typography, { shouldForwardProp })(({ theme }) => ({
    opacity: 0.8,
    fontSize: '1.1rem',
    fontWeight: 400,
    color: 'white',
    borderRadius: 0,
}));

export const NavItemButton = styled(ListItemButton, { shouldForwardProp })(({ theme, selected }) => ({
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    borderRadius: 0,
    backgroundColor: selected ? 'rgba(0, 0, 0, 0.15)' : 'transparent',
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '& .MuiListItemIcon-root': {
        minWidth: 40,
        color: 'white',
    },
}));

export const NavSubItemButton = styled(ListItemButton, { shouldForwardProp })(({ theme, selected }) => ({
    paddingLeft: theme.spacing(7),
    paddingTop: theme.spacing(0.85),
    paddingBottom: theme.spacing(0.85),
    borderRadius: 0,
    backgroundColor: selected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    position: 'relative',
    '&::after': selected ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: theme.spacing(7),
        right: theme.spacing(2),
        height: 3,
        backgroundColor: 'white',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    } : {},
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
}));

export const BottomSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
    boxSizing: 'border-box',
}));

export const LogoutButton = styled(ListItemButton)(({ theme }) => ({
    borderRadius: 0,
    paddingTop: theme.spacing(0.65),
    paddingBottom: theme.spacing(0.65),
    minHeight: 36,
    color: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
        color: 'white',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    '& .MuiListItemText-primary': {
        fontSize: '0.82rem',
    },
    '& .MuiListItemIcon-root': {
        minWidth: 34,
        color: 'inherit',
    },
}));
