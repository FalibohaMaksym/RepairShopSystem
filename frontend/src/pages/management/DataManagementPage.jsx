import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography, useTheme } from '@mui/material';
import BranchesPanel    from './components/BranchesPanel';
import ServicesPanel    from './components/ServicesPanel';
import DictionariesPanel from './components/DictionariesPanel';
import { useLanguage } from '../../app/i18n/LanguageContext';

const DataManagementPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [activeTab, setActiveTab] = useState(0);
    const { lang } = useLanguage();

    return (
        <Box sx={{ width: '100%', minWidth: 0 }}>
            <Typography component="h1" variant="h4" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary' }}>
                {lang === 'ua' ? 'Управління даними' : 'Data Management'}
            </Typography>

            {/* Tab navigation */}
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2.5,
                    bgcolor: 'background.paper',
                    borderRadius: '8px 8px 0 0',
                    boxShadow: isDark
                        ? '0 1px 3px rgba(0,0,0,0.4)'
                        : '0 1px 3px rgba(0,0,0,0.08)',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ px: 1 }}
                >
                    <Tab label={lang === 'ua' ? 'Відділення' : 'Branches'}  sx={{ fontSize: '0.88rem', fontWeight: 500 }} />
                    <Tab label={lang === 'ua' ? 'Послуги' : 'Services'}     sx={{ fontSize: '0.88rem', fontWeight: 500 }} />
                    <Tab label={lang === 'ua' ? 'Довідники' : 'Dictionaries'}   sx={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </Tabs>
            </Box>

            {/* Tab panels — render only the active tab */}
            {activeTab === 0 && <BranchesPanel />}
            {activeTab === 1 && <ServicesPanel />}
            {activeTab === 2 && <DictionariesPanel />}
        </Box>
    );
};

export default DataManagementPage;
