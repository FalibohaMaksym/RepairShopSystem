// Temporary mocked source for active supplies until backend endpoints are available.
const MOCK_ACTIVE_SUPPLIES = [
    {
        id: 'SX117204',
        status: 'NEW',
        createdAt: '2026-04-18',
        expectedDate: '2026-04-24',
        amount: 12250,
        progress: 0,
    },
    {
        id: 'SX117191',
        status: 'IN_PROGRESS',
        createdAt: '2026-04-17',
        expectedDate: '2026-04-22',
        amount: 19840,
        progress: 63,
    },
    {
        id: 'SX117176',
        status: 'IN_PROGRESS',
        createdAt: '2026-04-16',
        expectedDate: '2026-04-21',
        amount: 7640,
        progress: 41,
    },
    {
        id: 'SX117160',
        status: 'IN_PROGRESS',
        createdAt: '2026-04-14',
        expectedDate: '2026-04-20',
        amount: 25400,
        progress: 78,
    },
    {
        id: 'SX117143',
        status: 'NEW',
        createdAt: '2026-04-12',
        expectedDate: '2026-04-26',
        amount: 9360,
        progress: 0,
    },
    {
        id: 'SX117129',
        status: 'NEW',
        createdAt: '2026-04-10',
        expectedDate: '2026-04-28',
        amount: 5120,
        progress: 0,
    },
    {
        id: 'SX117121',
        status: 'IN_PROGRESS',
        createdAt: '2026-04-09',
        expectedDate: '2026-04-19',
        amount: 14310,
        progress: 92,
    },
];

/**
 * Loads active component supply orders.
 * TODO: Replace with real backend endpoint when it is implemented.
 * @returns {Promise<Array<{id:string,status:'NEW'|'IN_PROGRESS',createdAt:string,expectedDate:string,amount:number,progress:number}>>}
 */
export const fetchActiveSupplies = async () => {
    return MOCK_ACTIVE_SUPPLIES;
};
