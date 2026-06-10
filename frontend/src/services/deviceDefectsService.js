import apiClient from '../app/auth/axiosConfig';

/**
 * Fetches all available device defects for diagnostics autocomplete.
 * Endpoint: GET /api/device-defects
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export const fetchDeviceDefects = async () => {
    const response = await apiClient.get('/device-defects');

    if (!Array.isArray(response.data)) {
        return [];
    }

    return response.data
        .filter((item) => item?.id != null && item?.name)
        .map((item) => ({ id: item.id, name: item.name }));
};

/**
 * Creates a new defect in the device defects dictionary.
 * Endpoint: POST /api/device-defects
 * @param {string} name
 * @returns {Promise<{id: number, name: string}>}
 */
export const createDeviceDefect = async (name) => {
    const response = await apiClient.post('/device-defects', { name });
    const item = response?.data;

    if (item?.id == null || !item?.name) {
        throw new Error('Invalid create defect response');
    }

    return { id: item.id, name: item.name };
};

/**
 * Updates an existing defect in the device defects dictionary.
 * Expected endpoint: PUT /api/device-defects/{id}
 * @param {number} id
 * @param {string} name
 * @returns {Promise<{id: number, name: string}>}
 */
export const updateDeviceDefect = async (id, name) => {
    const response = await apiClient.put(`/device-defects/${id}`, { name });
    const item = response?.data;

    if (item?.id == null || !item?.name) {
        throw new Error('Invalid update defect response');
    }

    return { id: item.id, name: item.name };
};

/**
 * Deletes an existing defect from the device defects dictionary.
 * Expected endpoint: DELETE /api/device-defects/{id}
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteDeviceDefect = async (id) => {
    await apiClient.delete(`/device-defects/${id}`);
};
