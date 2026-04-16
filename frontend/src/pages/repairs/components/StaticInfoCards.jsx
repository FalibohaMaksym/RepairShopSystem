import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { customerCardSx, deviceCardSx, infoGridSx } from '../OrderDetailsPage.styles';

const SectionLabel = ({ title }) => (
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
        {title}
    </Typography>
);

const wrapSx = { wordBreak: 'break-word', overflowWrap: 'break-word' };

const DeviceCard = ({ labels, deviceInfo }) => (
    <Paper sx={deviceCardSx}>
        <SectionLabel title={labels.DEVICE_SECTION_TITLE} />
        <Typography sx={wrapSx}><b>{labels.DEVICE_SERIAL}:</b> {deviceInfo.serialNumber}</Typography>
        <Typography sx={{ mt: 1, ...wrapSx }}><b>{labels.DEVICE_INFO}:</b> {deviceInfo.deviceInfo}</Typography>
        <Typography sx={{ mt: 1, ...wrapSx }}><b>{labels.DEVICE_OUTER_STATE}:</b> {deviceInfo.outerState}</Typography>
        <Typography sx={{ mt: 1, ...wrapSx }}><b>{labels.DEVICE_ADDITIONAL_INFO}:</b> {deviceInfo.additionalInfo}</Typography>
        <Typography sx={{ mt: 1, ...wrapSx }}><b>{labels.DEVICE_PROBLEM}:</b> {deviceInfo.problemDescription}</Typography>
    </Paper>
);

const CustomerCard = ({ labels, customerInfo }) => (
    <Paper sx={{ ...customerCardSx, alignSelf: 'start', height: 'fit-content' }}>
        <SectionLabel title={labels.CUSTOMER_SECTION_TITLE} />
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    md: '1fr 1fr 1fr',
                },
                gap: 1,
                alignItems: 'center',
            }}
        >
            <Typography><b>{labels.CUSTOMER_NAME}:</b> {customerInfo.fullName}</Typography>
            <Typography><b>{labels.CUSTOMER_PHONE}:</b> {customerInfo.phoneNumber}</Typography>
            <Typography><b>Email:</b> {customerInfo.email}</Typography>
        </Box>
    </Paper>
);

const StaticInfoCards = ({ labels, deviceInfo, customerInfo, mode = 'both' }) => {
    if (mode === 'device') {
        return <DeviceCard labels={labels} deviceInfo={deviceInfo} />;
    }

    if (mode === 'customer') {
        return <CustomerCard labels={labels} customerInfo={customerInfo} />;
    }

    return (
        <Box sx={infoGridSx}>
            <DeviceCard labels={labels} deviceInfo={deviceInfo} />
            <CustomerCard labels={labels} customerInfo={customerInfo} />
        </Box>
    );
};

export default StaticInfoCards;
