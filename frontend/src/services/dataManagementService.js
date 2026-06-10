import apiClient from '../app/auth/axiosConfig';

// ─── Dictionaries (/api/data-management/{type}) ───────────────────────────────
// Response shape: { id: number, name: string }

export const fetchDictionaryItems = async (type) => {
    const response = await apiClient.get(`/data-management/${type}`);
    return Array.isArray(response.data) ? response.data : [];
};

export const createDictionaryItem = async (type, name) => {
    const response = await apiClient.post(`/data-management/${type}`, { name });
    return response.data;
};

export const updateDictionaryItem = async (type, id, name) => {
    const response = await apiClient.put(`/data-management/${type}/${id}`, { name });
    return response.data;
};

export const deleteDictionaryItem = async (type, id) => {
    await apiClient.delete(`/data-management/${type}/${id}`);
};

// ─── Suppliers (/api/suppliers) ───────────────────────────────────────────────
// Response shape: { id, companyName, phone, email }

export const fetchSuppliers = async () => {
    const response = await apiClient.get('/suppliers');
    return Array.isArray(response.data) ? response.data : [];
};

export const createSupplier = async (payload) => {
    const response = await apiClient.post('/suppliers', payload);
    return response.data;
};

export const updateSupplier = async (id, payload) => {
    const response = await apiClient.put(`/suppliers/${id}`, payload);
    return response.data;
};

export const deleteSupplier = async (id) => {
    await apiClient.delete(`/suppliers/${id}`);
};

// ─── Branches (/api/branches) ─────────────────────────────────────────────────

export const createBranch = async (payload) => {
    const response = await apiClient.post('/branches', payload);
    return response.data;
};

export const updateBranch = async (id, payload) => {
    const response = await apiClient.put(`/branches/${id}`, payload);
    return response.data;
};

export const deleteBranch = async (id) => {
    await apiClient.delete(`/branches/${id}`);
};

// ─── Repair Services (/api/repair-services) ───────────────────────────────────
// Response shape: { serviceId, serviceName, estimatedPrice, categoryName, complexityValue, deviceTypeName }

export const fetchRepairServices = async () => {
    const response = await apiClient.get('/repair-services');
    return Array.isArray(response.data) ? response.data : [];
};

export const searchRepairServices = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return fetchRepairServices();
    const response = await apiClient.get('/repair-services/search', { params: { query: trimmed } });
    return Array.isArray(response.data) ? response.data : [];
};

export const createRepairService = async (payload) => {
    const response = await apiClient.post('/repair-services', payload);
    return response.data;
};

export const updateRepairService = async (id, payload) => {
    const response = await apiClient.put(`/repair-services/${id}`, payload);
    return response.data;
};

export const deleteRepairService = async (id) => {
    await apiClient.delete(`/repair-services/${id}`);
};

// ─── Worker Services & Branch (/api/workers/{id}/...) ─────────────────────────

/**
 * GET /api/workers/{workerId}/services
 * Response: [{ workerServiceId, serviceId, serviceName, estimatedPrice, categoryName, complexityValue, deviceTypeName }]
 */
export const fetchWorkerServices = async (workerId) => {
    const response = await apiClient.get(`/workers/${workerId}/services`);
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * POST /api/workers/{workerId}/services
 */
export const addWorkerService = async (workerId, serviceId) => {
    const response = await apiClient.post(`/workers/${workerId}/services`, { serviceId });
    return response.data;
};

/**
 * DELETE /api/workers/{workerId}/services/{workerServiceId}
 */
export const removeWorkerService = async (workerId, workerServiceId) => {
    await apiClient.delete(`/workers/${workerId}/services/${workerServiceId}`);
};

/**
 * PUT /api/workers/{workerId}/branch/{newBranchId}
 */
export const moveWorkerToBranch = async (workerId, newBranchId) => {
    await apiClient.put(`/workers/${workerId}/branch/${newBranchId}`);
};
