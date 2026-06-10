export const filterCardPaperSx = (theme) => ({
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark'
        ? 'rgba(100,100,100,0.5)'
        : 'rgba(68,68,68,0.28)',
    bgcolor: 'background.paper',
    borderRadius: 1,
    overflow: 'hidden',
});

export const filterCardHeaderSx = (collapsible) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 1.5,
    py: 0.75,
    borderBottom: '1px solid',
    borderColor: 'divider',
    cursor: collapsible ? 'pointer' : 'default',
    position: 'relative',
    userSelect: 'none',
});

export const filterCardTitleSx = { fontSize: '0.85rem' };
export const filterCardToggleSx = { position: 'absolute', right: 6, display: 'flex', alignItems: 'center' };
export const filterCardBodySx = { px: 1.5, py: 1 };
export const filterCardExpandIconSx = { fontSize: 18 };

export const filterInputSx = {
    bgcolor: 'background.default',
    borderRadius: 1,
    '& .MuiInputBase-root': {
        minHeight: 33,
    },
    '& .MuiInputBase-input': {
        py: 0.45,
        fontSize: '0.82rem',
    },
};

export const modalInputSx = {
    '& .MuiInputBase-root': {
        minHeight: { xs: 36, sm: 38 },
        bgcolor: 'background.paper',
        borderRadius: 0,
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: 0,
    },
    '& .MuiInputBase-input': {
        fontSize: '0.83rem',
        py: 0.5,
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.75rem',
    },
    '& .MuiFormHelperText-root': {
        fontSize: '0.67rem',
        ml: 0,
        mt: 0.35,
    },
};

export const pageTitleSx = {
    mb: 3,
    color: 'text.primary',
    fontSize: { xs: '1.45rem', md: '1.7rem' },
};

export const toolbarSx = (filterOpen) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    mb: filterOpen ? 1.5 : 3,
    flexWrap: 'wrap',
});

export const searchFieldSx = {
    flex: '1 1 260px',
    maxWidth: 440,
    bgcolor: 'background.paper',
    borderRadius: 1,
};

export const filterToggleButtonSx = (filterOpen) => ({
    bgcolor: filterOpen
        ? 'rgba(112,169,215,0.45)'
        : 'rgba(112,169,215,0.25)',
    border: '1px solid',
    borderColor: filterOpen ? 'primary.main' : 'primary.light',
    borderRadius: 1,
    '&:hover': { bgcolor: 'rgba(112,169,215,0.4)' },
});

export const sortControlSx = { minWidth: 200, bgcolor: 'background.paper', borderRadius: 1 };
export const masterTabsContainerSx = {
    minHeight: 34,
    mb: 2,
    borderBottom: '1px solid',
    borderColor: 'divider',
    '& .MuiTabs-indicator': {
        height: 2,
    },
};
export const masterTabSx = {
    minHeight: 34,
    px: 2,
    py: 0.5,
    textTransform: 'none',
    fontSize: '0.84rem',
    fontWeight: 500,
    alignItems: 'center',
};
export const toolbarSpacerSx = { flexGrow: 1 };
export const createOrderButtonSx = { whiteSpace: 'nowrap', py: 1.2, px: 3, fontWeight: 500 };

export const createDialogPaperSx = {
    width: 'min(95vw, 1160px)',
    maxHeight: 'min(90vh, 980px)',
    m: { xs: 1, sm: 2 },
    borderRadius: 0,
    bgcolor: 'background.paper',
};

export const createDialogContentSx = {
    px: { xs: 1.4, sm: 2.05 },
    pb: { xs: 1.4, sm: 2.05 },
    pt: { xs: 0.5, sm: 0.55 },
    overflow: 'auto',
    '& .MuiStack-root': {
        rowGap: 2.4,
    },
    '& .MuiButton-root': {
        borderRadius: 0,
    },
    '& .MuiIconButton-root': {
        borderRadius: 0,
    },
};

export const modalTopRightSx = { display: 'flex', justifyContent: 'flex-end' };
export const modalSearchRowSx = { display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' };
export const modalClientSearchFieldSx = { flex: '1 1 280px', maxWidth: { xs: '100%', sm: 380 } };
export const modalDeviceSearchFieldSx = { flex: '1 1 320px', maxWidth: { xs: '100%', sm: 420 } };
export const linkSmallSx = { fontSize: '0.75rem' };
export const linkSmallNoWrapSx = { fontSize: '0.75rem', whiteSpace: 'nowrap' };

export const sectionCardSx = {
    bgcolor: 'background.alt',
    p: { xs: 1.6, sm: 1.9 },
    borderRadius: 0,
};

export const customerGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
    gap: 1.25,
};

export const deviceGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(190px, 0.9fr) 240px minmax(210px, 1fr)' },
    gap: 1.5,
    alignItems: 'start',
};

export const usagePeriodLabelSx = { display: 'block', mb: 0.5 };
export const usagePeriodControlSx = {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 0,
    px: 0.6,
    minHeight: 38,
    bgcolor: 'background.paper',
};
export const usagePeriodValueSx = { minWidth: 32, textAlign: 'center', fontSize: '0.85rem' };
export const searchDeviceRowSx = { display: 'flex', alignItems: 'center', gap: 0.75 };

export const modalInnerBlueCardSx = {
    mt: 1.2,
    bgcolor: 'rgba(25,118,210,0.18)',
    p: { xs: 1.5, sm: 2.5 },
    borderRadius: 0,
};

export const modalInnerBlueGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1.4fr' },
    columnGap: 1.25,
    rowGap: 1.9,
};

export const modalInnerActionsSx = { mt: 1.1, display: 'flex', justifyContent: 'flex-end', gap: 2, width: '100%' };
export const modalCreateClientDeviceButtonSx = {
    borderRadius: 0,
    bgcolor: 'secondary.dark',
    '&:hover': { bgcolor: 'secondary.main' },
};

export const modalTextareasGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
    gap: 1.25,
};

export const modalBottomActionsSx = { display: 'flex', justifyContent: 'flex-end', gap: 1.25, pt: 1.1 };

export const filterPanelPaperSx = (theme) => ({
    backdropFilter: 'blur(4px)',
    bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(22,27,34,0.82)'
        : 'rgba(112,169,215,0.18)',
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark'
        ? 'rgba(68,68,68,0.55)'
        : 'rgba(68,68,68,0.35)',
    borderRadius: 2,
    p: 2,
    mb: 3,
});

export const filterPanelContentSx = {
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
};

export const leftFilterColumnSx = {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
    flex: '1 1 180px',
    minWidth: 160,
};

export const centerFilterColumnSx = { flex: '1 1 180px', minWidth: 160 };

export const rightFilterColumnSx = {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
    flex: '1 1 220px',
    minWidth: 200,
};

export const checkboxLabelSx = { fontSize: '0.85rem' };
export const checkboxRowSx = { display: 'flex', m: 0, py: 0, minHeight: 28 };
export const rangeInputsRowSx = { display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' };

export const clearFiltersRowSx = { display: 'flex', justifyContent: 'flex-end', pt: 1.5 };
export const clearFiltersButtonSx = { textTransform: 'none' };

export const loadingBoxSx = { display: 'flex', justifyContent: 'center', mt: 8 };
export const errorAlertSx = { mt: 2 };
export const emptyStateSx = { textAlign: 'center', mt: 8 };

export const ordersGridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        lg: 'repeat(3, 1fr)',
    },
    gap: 3,
};
