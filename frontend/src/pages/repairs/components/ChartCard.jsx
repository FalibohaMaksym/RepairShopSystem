import React from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';

/**
 * Reusable analytics chart card.
 * Handles loading / error states and renders a consistent header with optional controls.
 */
const ChartCard = React.memo(({ title, controls, loading, error, children, minHeight = 280, sx }) => (
    <Card sx={{ bgcolor: 'background.paper', boxShadow: 2, borderRadius: 2, height: '100%', ...sx }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
                <Typography fontWeight={600} sx={{ fontSize: '0.93rem', color: 'text.primary', lineHeight: 1.3 }}>
                    {title}
                </Typography>
                {controls && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {controls}
                    </Box>
                )}
            </Box>

            {/* Body */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: loading || error ? 'center' : 'stretch', justifyContent: loading || error ? 'center' : 'stretch', flexDirection: 'column', minHeight }}>
                {loading && <CircularProgress size={32} />}
                {!loading && error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && children}
            </Box>
        </CardContent>
    </Card>
));

ChartCard.displayName = 'ChartCard';
export default ChartCard;
