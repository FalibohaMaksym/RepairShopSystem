import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import {
    diagnosticsSectionSx,
    dynamicSectionSx,
    repairsSectionSx,
    sectionsGridSx,
} from '../OrderDetailsPage.styles';

const resolveSectionStyle = (variant) => {
    if (variant === 'diagnostics') return diagnosticsSectionSx;
    if (variant === 'repairs') return repairsSectionSx;
    return dynamicSectionSx;
};

const DynamicOrderSections = ({ sections, singleColumn = false }) => {
    const containerSx = singleColumn
        ? { display: 'flex', flexDirection: 'column', gap: 2 }
        : sectionsGridSx;

    return (
        <Box sx={containerSx}>
            {sections.map((section) => (
                <Paper key={section.id} sx={resolveSectionStyle(section.variant)}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 500,
                            mb: 1,
                            display: 'inline-flex',
                            px: 0.8,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        {section.title}
                    </Typography>

                    {Array.isArray(section.fields) && section.fields.length > 0 && (
                        <Box sx={{ display: 'grid', gap: 0.7, mb: section.note ? 1 : 0 }}>
                            {section.fields.map((field) => (
                                <Typography
                                    key={`${section.id}-${field.label}`}
                                    color="text.secondary"
                                    sx={{ fontSize: '0.9rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                >
                                    <b>{field.label}:</b> {field.value}
                                </Typography>
                            ))}
                        </Box>
                    )}

                    {Array.isArray(section.listItems) && section.listItems.length > 0 && (
                        <Box sx={{ mb: section.note ? 1 : 0 }}>
                            {section.listTitle && (
                                <Typography color="text.secondary" sx={{ fontWeight: 600, mb: 0.4 }}>
                                    {section.listTitle}
                                </Typography>
                            )}
                            <Box component="ul" sx={{ m: 0, pl: 2.4, color: 'text.secondary' }}>
                                {section.listItems.map((item) => (
                                    <li key={`${section.id}-${item}`}>
                                        <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                            {item}
                                        </Typography>
                                    </li>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {section.note && (
                        <Typography color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {section.note}
                        </Typography>
                    )}

                    {section.actionButton && (
                        <Box sx={{ mt: '3%', display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                onClick={section.actionButton.onClick}
                                disabled={section.actionButton.disabled}
                                sx={section.actionButton.sx}
                            >
                                {section.actionButton.label}
                            </Button>
                        </Box>
                    )}
                </Paper>
            ))}
        </Box>
    );
};

export default DynamicOrderSections;
