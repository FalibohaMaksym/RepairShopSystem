import apiClient from '../app/auth/axiosConfig';

/**
 * Fetches branch stock — all components across all branches, optionally filtered by branch.
 * Endpoint: GET /api/stock
 * @param {number|null} branchId — optional branch filter
 * @returns {Promise<Array>} Normalized list of stock items.
 */
export const fetchStock = async (branchId = null) => {
    const params = branchId != null ? { branchId } : {};
    const response = await apiClient.get('/stock', { params });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches stock for the authenticated user's branch. Branch is resolved from JWT on the backend.
 * Endpoint: GET /api/stock/my
 * @returns {Promise<Array>} Normalized list of stock items for the current branch.
 */
export const fetchMyStock = async () => {
    const response = await apiClient.get('/stock/my');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches components that are missing for pending (not yet started) services in the
 * authenticated user's branch. Returns other branches that have enough quantity.
 * Endpoint: GET /api/stock/missing
 * @param {number|null} componentId — optional filter to a specific component
 * @returns {Promise<Array<{
 *   componentId, componentModel, categoryName, manufacturer,
 *   requiredQuantity, otherBranchAddress, quantityInOtherBranch
 * }>>}
 */
export const fetchMissingStock = async (componentId = null) => {
    const params = componentId != null ? { componentId } : {};
    const response = await apiClient.get('/stock/missing', { params });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Transfers components from one branch to another.
 * Endpoint: POST /api/stock/transfer
 * @param {{ fromBranchId: number, toBranchId: number, componentId: number, quantity: number }} payload
 * @returns {Promise<void>} 204 No Content on success.
 */
export const transferStock = async ({ fromBranchId, toBranchId, componentId, quantity }) => {
    await apiClient.post('/stock/transfer', { fromBranchId, toBranchId, componentId, quantity });
};

/**
 * Fetches all branches for use in dropdowns.
 * Endpoint: GET /api/branches
 * @returns {Promise<Array<{id: number, address: string}>>}
 */
export const fetchBranches = async () => {
    const response = await apiClient.get('/branches');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches the current user's branch from JWT.
 * Endpoint: GET /api/branches/my
 * @returns {Promise<{id: number, address: string, phoneNumber: string, email: string}>}
 */
export const fetchMyBranch = async () => {
    const response = await apiClient.get('/branches/my');
    return response.data;
};
