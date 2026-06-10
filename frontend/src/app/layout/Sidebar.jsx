import React, { useState } from 'react';
import { 
    Box,
    List, 
    Typography,
    ListItemIcon, 
    ListItemText, 
    Collapse, 
    IconButton,
    Menu,
    MenuItem,
    useTheme
} from '@mui/material';
import { 
    ExpandLess, 
    ExpandMore, 
    Handyman as RepairIcon, 
    LocalShipping as SupplyIcon, 
    AdminPanelSettings as ManagementIcon,
    Language as LanguageIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Assessment as AssessmentIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { APP_ROLES, normalizeRole } from '../auth/roleUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppTheme } from '../theme/ThemeContext';
import {
    SidebarContainer,
    ProfileSection,
    ProfileName,
    ProfileRole,
    NavItemButton,
    NavSubItemButton,
    BottomSection,
    LogoutButton
} from './Sidebar.styles';

/**
 * Sidebar Navigation Component
 */
const Sidebar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { lang, setLang, labels } = useLanguage();
    const { mode, toggleTheme } = useAppTheme();
    const NAV = labels.navigation;
    
    // State for collapsible menus
    const [openMenus, setOpenMenus] = useState({
        repairs: true,
        supplies: false,
        management: false
    });

    const [langAnchor, setLangAnchor] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const isSelected = (path) => location.pathname === path;

    const handleLangClick = (event) => {
        setLangAnchor(event.currentTarget);
    };

    const handleLangClose = () => {
        setLangAnchor(null);
    };

    const handleLangChange = (newLang) => {
        setLang(newLang);
        handleLangClose();
    };

    const userRole = normalizeRole(user?.role);
    const userName = user?.name || localStorage.getItem('userName') || user?.sub || (lang === 'ua' ? 'Користувач' : 'User');
    
    const getRoleDisplayName = (role) => {
        if (role) return role;
        return lang === 'ua' ? 'Гість' : 'Guest';
    };

    const userRoleDisplay = getRoleDisplayName(user?.role);

    // Menu Configuration with Role Access
    const menuConfig = [
        {
            id: 'repairs',
            label: NAV.REPAIRS,
            icon: <RepairIcon />,
            roles: [APP_ROLES.MASTER, APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN],
            subItems: [
                { label: NAV.REPAIRS_ACTIVE, path: '/repairs/active', roles: [APP_ROLES.MASTER, APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN] },
                { label: NAV.REPAIRS_ARCHIVE, path: '/repairs/archive', roles: [APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN] },
            ]
        },
        {
            id: 'analytics',
            label: NAV.ANALYTICS,
            icon: <AssessmentIcon />,
            roles: [APP_ROLES.SENIOR_ADMIN],
            path: '/repairs/analytics',
            subItems: []
        },
        {
            id: 'supplies',
            label: NAV.SUPPLIES,
            icon: <SupplyIcon />,
            roles: [APP_ROLES.SENIOR_ADMIN],
            subItems: [
                { label: NAV.SUPPLIES_ACTIVE, path: '/supplies/active', roles: [APP_ROLES.SENIOR_ADMIN] },
                { label: NAV.SUPPLIES_ARCHIVE, path: '/supplies/archive', roles: [APP_ROLES.SENIOR_ADMIN] },
            ]
        },
        {
            id: 'management',
            label: NAV.MANAGEMENT,
            icon: <ManagementIcon />,
            roles: [APP_ROLES.SYSTEM_ADMIN],
            subItems: [
                { label: NAV.MANAGEMENT_DATA, path: '/management/data', roles: [APP_ROLES.SYSTEM_ADMIN] },
                { label: NAV.MANAGEMENT_USERS, path: '/management/users', roles: [APP_ROLES.SYSTEM_ADMIN] },
            ]
        }
    ];

    return (
        <SidebarContainer>
            {/* Top Bar (Theme & Language) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.7, alignItems: 'center' }}>
                <IconButton 
                    size="small" 
                    onClick={toggleTheme}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                    {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
                <Box>
                    <IconButton 
                        size="small" 
                        sx={{ color: 'white' }}
                        onClick={handleLangClick}
                    >
                        <LanguageIcon fontSize="small" />
                        <Typography sx={{ ml: 0.5, fontSize: '0.69rem', fontWeight: 600 }}>
                            {lang.toUpperCase()}
                        </Typography>
                    </IconButton>
                    <Menu
                        anchorEl={langAnchor}
                        open={Boolean(langAnchor)}
                        onClose={handleLangClose}
                    >
                        <MenuItem onClick={() => handleLangChange('ua')}>Українська (UA)</MenuItem>
                        <MenuItem onClick={() => handleLangChange('en')}>English (EN)</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Profile Section */}
            <ProfileSection>
                <ProfileName variant="h1">
                    {userName}
                </ProfileName>
                <ProfileRole variant="h2">
                    {userRoleDisplay}
                </ProfileRole>
            </ProfileSection>

            {/* Navigation List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List component="nav" disablePadding>
                    {menuConfig.filter(menu => menu.roles.includes(userRole)).map((menu) => (
                        <React.Fragment key={menu.id}>
                            <NavItemButton 
                                selected={menu.path && isSelected(menu.path)}
                                onClick={() => menu.subItems && menu.subItems.length > 0 ? toggleMenu(menu.id) : navigate(menu.path)}
                            >
                                <ListItemIcon>
                                    {menu.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={menu.label} 
                                    sx={{ 
                                        '& .MuiListItemText-primary': { 
                                            fontWeight: 500, 
                                            fontSize: '0.88rem' 
                                        } 
                                    }} 
                                />
                                {menu.subItems && menu.subItems.length > 0 && (
                                    openMenus[menu.id] ? <ExpandLess /> : <ExpandMore />
                                )}
                            </NavItemButton>
                            
                            {menu.subItems && menu.subItems.length > 0 && (
                                <Collapse in={openMenus[menu.id]} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {menu.subItems.filter(item => item.roles.includes(userRole)).map((item) => (
                                            <NavSubItemButton 
                                                key={item.label}
                                                selected={isSelected(item.path)}
                                                onClick={() => navigate(item.path)}
                                            >
                                                <ListItemText 
                                                    primary={item.label} 
                                                    sx={{ 
                                                        '& .MuiListItemText-primary': { 
                                                            fontSize: '0.78rem',
                                                            fontWeight: isSelected(item.path) ? 500 : 400
                                                        } 
                                                    }} 
                                                />
                                            </NavSubItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Box>

            {/* Logout Section */}
            <BottomSection>
                <LogoutButton onClick={logout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={NAV.LOGOUT} />
                </LogoutButton>
            </BottomSection>
        </SidebarContainer>
    );
};

export default Sidebar;
