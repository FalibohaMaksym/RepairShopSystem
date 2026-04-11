import React, { useState } from 'react';
import { 
    Box, 
    Drawer, 
    AppBar, 
    Toolbar, 
    Typography, 
    IconButton,
    useTheme
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Principal layout for protected pages.
 */
const MainLayout = () => {
    const theme = useTheme();
    const sidebarWidth = theme.layout?.sidebarWidth || 320;
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Mobile AppBar - only visible on small screens */}
            <AppBar
                position="fixed"
                sx={{
                    display: { sm: 'none' },
                    bgcolor: 'primary.main',
                    boxShadow: 0
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        RepairShop
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: sidebarWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: sidebarWidth, border: 'none' },
                    }}
                >
                    <Sidebar />
                </Drawer>
                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: sidebarWidth, 
                            border: 'none',
                            borderRadius: 0,
                            boxShadow: '4px 0 10px rgba(0,0,0,0.05)'
                        },
                    }}
                    open
                >
                    <Sidebar />
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    p: 3,
                    width: { sm: `calc(100% - ${sidebarWidth}px)` },
                    bgcolor: 'background.default'
                }}
            >
                {/* Spacer only for mobile AppBar */}
                <Toolbar sx={{ display: { xs: 'block', sm: 'none' } }} />
                <Outlet />
            </Box>
        </Box>
    );

};

export default MainLayout;
