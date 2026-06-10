import apiClient from '../app/auth/axiosConfig';

// ─── Components catalog ────────────────────────────────────────────────────────

/**
 * Fetches components with optional filters.
 * Endpoint: GET /api/components
 * @param {{ search?, categoryId?, producerId?, minPrice?, maxPrice? }} params
 */
export const fetchComponents = async (params = {}) => {
    const response = await apiClient.get('/components', { params });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Endpoint: GET /api/components/categories
 */
export const fetchCategories = async () => {
    const response = await apiClient.get('/components/categories');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Endpoint: GET /api/components/producers
 */
export const fetchProducers = async () => {
    const response = await apiClient.get('/components/producers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Endpoint: GET /api/components/warranty-obligations
 */
export const fetchWarrantyObligations = async () => {
    const response = await apiClient.get('/components/warranty-obligations');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new component in the catalog.
 * TODO: POST /api/components
 * @param {{ categoryId, warrantyObligationId?, producerId, model, price, warrantyPeriod }} data
 */
/**
 * @param {{ componentModel, producerId, categoryId, warrantyObligationId, warrantyPeriod, componentPrice }} data
 */
export const createComponent = async (data) => {
    const response = await apiClient.post('/components', data);
    return response.data;
};

/**
 * Deletes a component by ID.
 * Endpoint: DELETE /api/components/{id}
 * @param {number} id
 */
export const deleteComponent = async (id) => {
    await apiClient.delete(`/components/${id}`);
};

// ─── Suppliers ─────────────────────────────────────────────────────────────────

/**
 * Endpoint: GET /api/suppliers
 * @returns {Promise<Array<{ id, companyName }>>}
 */
export const fetchSuppliers = async () => {
    const response = await apiClient.get('/suppliers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new supplier.
 * Endpoint: POST /api/suppliers
 * @param {{ companyName: string }} data
 */
export const createSupplier = async (data) => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
};

/**
 * Deletes a supplier by ID.
 * Endpoint: DELETE /api/suppliers/{id}
 * @param {number} id
 */
export const deleteSupplier = async (id) => {
    await apiClient.delete(`/suppliers/${id}`);
};

// ─── Component orders ──────────────────────────────────────────────────────────

/**
 * Fetches active component orders (status: замовлено / виконується).
 * Returns one row per component item — group by orderNumber on the client.
 * Endpoint: GET /api/component-orders/active
 */
export const fetchActiveComponentOrders = async () => {
    const response = await apiClient.get('/component-orders/active');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Deletes a component order by ID.
 * Endpoint: DELETE /api/component-orders/{orderId}
 * @param {number} orderId
 */
export const deleteComponentOrder = async (orderId) => {
    await apiClient.delete(`/component-orders/${orderId}`);
};

/**
 * Updates an existing component order (only for orders with no supplies yet).
 * Endpoint: PUT /api/component-orders/{orderId}
 * Body is identical to POST /api/component-orders.
 * @param {number} orderId
 * @param {{
 *   supplierId: number,
 *   expectedExecutionDate?: string,
 *   items: Array<{ componentId, quantity, unitPrice }>
 * }} data
 */
export const updateComponentOrder = async (orderId, data) => {
    const response = await apiClient.put(`/component-orders/${orderId}`, data);
    return response.data;
};

/**
 * Creates a new component order.
 * Endpoint: POST /api/component-orders
 * @param {{
 *   supplierId: number,
 *   expectedExecutionDate?: string,
 *   items: Array<{ componentId, quantity, unitPrice }>
 * }} data
 */
export const createComponentOrder = async (data) => {
    const response = await apiClient.post('/component-orders', data);
    return response.data;
};

/**
 * Fetches archived component orders (status: виконано / прострочено).
 * Endpoint: GET /api/component-orders/archive
 */
export const fetchArchivedComponentOrders = async () => {
    const response = await apiClient.get('/component-orders/archive');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches details of a single component order (items include id and unitPrice).
 * Endpoint: GET /api/component-orders/{orderId}
 * @param {number} orderId
 */
export const fetchComponentOrderDetail = async (orderId) => {
    const response = await apiClient.get(`/component-orders/${orderId}`);
    return response.data;
};

/**
 * Fetches all supplies (deliveries) for a given component order.
 * Endpoint: GET /api/component-orders/{orderId}/supplies
 * @param {number} orderId
 */
export const fetchOrderSupplies = async (orderId) => {
    const response = await apiClient.get(`/component-orders/${orderId}/supplies`);
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new supply for a component order.
 * Endpoint: POST /api/component-orders/{orderId}/supplies
 * receivedBy is taken from JWT on the backend — do not send it.
 * @param {number} orderId
 * @param {{ invoiceNumber: string, deliveryDateTime: string, items: Array<{ orderItemId, quantity }> }} data
 */
export const createOrderSupply = async (orderId, data) => {
    const response = await apiClient.post(`/component-orders/${orderId}/supplies`, data);
    return response.data;
};
