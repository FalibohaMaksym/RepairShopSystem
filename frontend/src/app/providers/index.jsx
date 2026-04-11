import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/uk';

/**
 * Consolidated Providers component to wrap the entire application.
 * LocalizationProvider is placed inside ThemeProvider so MUI DatePicker
 * components automatically inherit the active MUI theme.
 */
export const Providers = ({ children }) => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
};
