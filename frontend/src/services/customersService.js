import apiClient from '../app/auth/axiosConfig';

/**
 * Searches customers by name, phone, or email.
 * Endpoint: GET /api/customers/search?query=<text>
 * @param {string} query
 * @returns {Promise<Array<{id:number,fullName:string,phoneNumber:string,email:string}>>}
 */
export const searchCustomers = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const response = await apiClient.get('/customers/search', {
        params: { query: trimmed },
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new customer.
 * Endpoint: POST /api/customers
 * @param {{fullName:string,phoneNumber?:string,email?:string}} payload
 * @returns {Promise<{id:number,fullName:string,phoneNumber:string,email:string}>}
 */
export const createCustomer = async (payload) => {
    const response = await apiClient.post('/customers', payload);
    return response.data;
};

/**
 * Updates an existing customer.
 * Endpoint: PUT /api/customers/{id}
 * @param {number} customerId
 * @param {{fullName:string,phoneNumber?:string,email?:string}} payload
 * @returns {Promise<{id:number,fullName:string,phoneNumber:string,email:string}>}
 */
export const updateCustomer = async (customerId, payload) => {
    const response = await apiClient.put(`/customers/${customerId}`, payload);
    return response.data;
};

/**
 * Deletes a customer.
 * Endpoint: DELETE /api/customers/{id}
 * @param {number} customerId
 * @returns {Promise<void>}
 */
export const deleteCustomer = async (customerId) => {
    await apiClient.delete(`/customers/${customerId}`);
};
