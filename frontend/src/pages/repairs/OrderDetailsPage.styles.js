export const pageTitleRowSx = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', md: 'center' },
    gap: 1.5,
    mb: 2,
};

export const pageTitleSx = {
    color: 'text.primary',
    fontSize: { xs: '1.6rem', md: '2.05rem' },
    fontWeight: 600,
};

export const topActionRowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    flexWrap: 'wrap',
};

export const orderMetaRowSx = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    mb: 2,
    color: 'text.secondary',
};

export const infoGridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        lg: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
    },
    alignItems: 'start',
    gap: 2,
    mb: 2,
};

export const detailsColumnsSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        lg: 'minmax(300px, 0.8fr) minmax(0, 1.2fr)',
    },
    alignItems: 'start',
    gap: 2,
};

export const detailsColumnSx = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
};

export const staticCardSx = {
    p: 2,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
    border: '1px solid',
};

export const deviceCardSx = {
    ...staticCardSx,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184, 204, 104, 0.15)' : '#E8EDC8',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(184, 204, 104, 0.4)' : '#cfd6a2',
};

export const customerCardSx = {
    ...staticCardSx,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(144, 153, 163, 0.15)' : '#F3F4F6',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(144, 153, 163, 0.4)' : '#cfd4da',
};

export const sectionsGridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        xl: '1fr 1fr',
    },
    gap: 2,
};

export const dynamicSectionSx = {
    p: 2,
    minHeight: 210,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
    border: '1px solid',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#cfd4da',
};

export const diagnosticsSectionSx = {
    ...dynamicSectionSx,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(190, 130, 210, 0.15)' : '#E2D2E6',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(190, 130, 210, 0.4)' : '#cfbed4',
};

export const repairsSectionSx = {
    ...dynamicSectionSx,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#C8D8E7',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.4)' : '#b2c5d6',
};
