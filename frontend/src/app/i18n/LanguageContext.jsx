import React, { createContext, useState, useContext, useEffect } from 'react';
import { AUTH_LABELS as uaAuth } from './authLabels.uk';
import { AUTH_LABELS as enAuth } from './authLabels.en';
import { NAVIGATION_LABELS as uaNav } from './navigationLabels.uk';
import { NAVIGATION_LABELS as enNav } from './navigationLabels.en';
import { REPAIRS_LABELS as uaRepairs } from './repairsLabels.uk';
import { REPAIRS_LABELS as enRepairs } from './repairsLabels.en';
import { SUPPLIES_LABELS as uaSupplies } from './suppliesLabels.uk';
import { SUPPLIES_LABELS as enSupplies } from './suppliesLabels.en';
import { ANALYTICS_LABELS as uaAnalytics } from './analyticsLabels.uk';
import { ANALYTICS_LABELS as enAnalytics } from './analyticsLabels.en';
import { MANAGEMENT_LABELS as uaManagement } from './managementLabels.uk';
import { MANAGEMENT_LABELS as enManagement } from './managementLabels.en';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const labels = lang === 'ua'
        ? { auth: uaAuth, navigation: uaNav, repairs: uaRepairs, supplies: uaSupplies, analytics: uaAnalytics, management: uaManagement }
        : { auth: enAuth, navigation: enNav, repairs: enRepairs, supplies: enSupplies, analytics: enAnalytics, management: enManagement };

    const value = {
        lang,
        setLang,
        labels
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
