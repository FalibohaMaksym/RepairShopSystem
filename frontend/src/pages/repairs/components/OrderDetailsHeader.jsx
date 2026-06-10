import React from 'react';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';
import { orderMetaRowSx, pageTitleRowSx, pageTitleSx, topActionRowSx } from '../OrderDetailsPage.styles';
import { STATUS_CONFIG } from '../statusConfig';

const OrderDetailsHeader = ({
    labels,
    orderNumber,
    createdBy,
    createdAt,
    status,
    statusKey = 'NEW',
    actionButton,
    deleteButton,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.NEW;
    const chipTextColor = isDark ? statusConfig.chipColorDark : statusConfig.chipColor;

    return (
        <>
            <Box sx={pageTitleRowSx}>
                <Typography component="h1" variant="h4" sx={pageTitleSx}>
                    {labels.ORDER_TITLE}: #{orderNumber}
                </Typography>

                <Box sx={topActionRowSx}>
                    {deleteButton && (
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={Boolean(deleteButton.disabled)}
                            onClick={deleteButton.onClick}
                            sx={{ px: 2.5, ...deleteButton.sx }}
                        >
                            {deleteButton.label}
                        </Button>
                    )}
                    <Chip
                        label={status}
                        sx={{
                            bgcolor: statusConfig.chipBg,
                            color: chipTextColor,
                            fontWeight: 600,
                            minWidth: 120,
                        }}
                    />
                    {actionButton && (
                        <Button
                            variant="contained"
                            sx={actionButton.sx || { px: 3 }}
                            disabled={Boolean(actionButton.disabled)}
                            onClick={actionButton.onClick}
                        >
                            {actionButton.label}
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={orderMetaRowSx}>
                <Typography>{labels.CREATED_BY}: {createdBy}</Typography>
                <Typography>{labels.CREATED_AT}: {createdAt}</Typography>
            </Box>
        </>
    );
};

export default OrderDetailsHeader;
