import apiClient from '../app/auth/axiosConfig';

/**
 * Loads all system roles.
 * Endpoint: GET /api/roles
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchRoles = async () => {
    const response = await apiClient.get('/roles');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Loads all worker positions.
 * Endpoint: GET /api/positions
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchPositions = async () => {
    const response = await apiClient.get('/positions');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Loads all branches.
 * Endpoint: GET /api/branches
 * @returns {Promise<Array<{id:number,address:string,phoneNumber?:string,email?:string}>>}
 */
export const fetchBranches = async () => {
    const response = await apiClient.get('/branches');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Searches branches by address.
 * Endpoint: GET /api/branches/search?query=<text>
 * @param {string} query
 * @returns {Promise<Array<{id:number,address:string,phoneNumber?:string,email?:string}>>}
 */
export const searchBranches = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const response = await apiClient.get('/branches/search', {
        params: { query: trimmed },
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Loads all system users.
 * Endpoint: GET /api/users
 * @returns {Promise<Array>} Array of UserResponse objects.
 */
export const fetchUsers = async () => {
    const response = await apiClient.get('/users');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Searches system users by full name or email.
 * Endpoint: GET /api/users/search?query=<text>
 * @param {string} query
 * @returns {Promise<Array>} Array of UserResponse objects.
 */
export const searchUsers = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const response = await apiClient.get('/users/search', {
        params: { query: trimmed },
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new system user.
 * Endpoint: POST /api/users
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createUser = async (payload) => {
    const response = await apiClient.post('/users', payload);
    return response.data;
};

/**
 * Updates an existing system user and linked worker profile.
 * Endpoint: PUT /api/users/{id}
 * @param {number|string} userId
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const updateUser = async (userId, payload) => {
    const response = await apiClient.put(`/users/${userId}`, payload);
    return response.data;
};

/**
 * Deletes a system user account.
 * Endpoint: DELETE /api/users/{id}
 * @param {number|string} userId
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
    await apiClient.delete(`/users/${userId}`);
};

/**
 * Loads all workers.
 * Endpoint: GET /api/users/workers
 * @returns {Promise<Array>} Array of WorkerResponse objects.
 */
export const fetchWorkers = async () => {
    const response = await apiClient.get('/users/workers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Searches workers by full name or email.
 * Endpoint: GET /api/users/workers/search?query=<text>
 * @param {string} query
 * @returns {Promise<Array>} Array of WorkerResponse objects.
 */
export const searchWorkers = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const response = await apiClient.get('/users/workers/search', {
        params: { query: trimmed },
    });

    return Array.isArray(response.data) ? response.data : [];
};
