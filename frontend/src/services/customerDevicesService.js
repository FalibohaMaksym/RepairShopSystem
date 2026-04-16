import apiClient from '../app/auth/axiosConfig';

/**
 * Fetches all devices for a selected customer.
 * Endpoint: GET /api/customer-devices?customerId=<id>
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
export const fetchCustomerDevicesByCustomerId = async (customerId) => {
    if (!customerId) return [];

    const response = await apiClient.get('/customer-devices', {
        params: { customerId },
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Searches base devices by model, type, or producer.
 * Endpoint: GET /api/customer-devices/devices/search?query=<text>
 * @param {string} query
 * @returns {Promise<Array<{id:number,deviceModel:string,deviceType:string,producer:string,devicePurpose?:string}>>}
 */
export const searchBaseDevices = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const response = await apiClient.get('/customer-devices/devices/search', {
        params: { query: trimmed },
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a customer device.
 * Endpoint: POST /api/customer-devices
 * @param {{
 *   deviceSerialNumber:string,
 *   externalConditionDescription:string,
 *   deviceUsageTime?:number,
 *   deviceAdditionalInfo?:string,
 *   deviceId:number,
 *   customerId:number
 * }} payload
 * @returns {Promise<object>}
 */
export const createCustomerDevice = async (payload) => {
    const response = await apiClient.post('/customer-devices', payload);
    return response.data;
};

/**
 * Updates an existing customer device.
 * Endpoint: PUT /api/customer-devices/{id}
 * @param {number} customerDeviceId
 * @param {{
 *   deviceSerialNumber:string,
 *   externalConditionDescription:string,
 *   deviceUsageTime?:number,
 *   deviceAdditionalInfo?:string,
 *   deviceId:number
 * }} payload
 * @returns {Promise<object>}
 */
export const updateCustomerDevice = async (customerDeviceId, payload) => {
    const response = await apiClient.put(`/customer-devices/${customerDeviceId}`, payload);
    return response.data;
};

/**
 * Deletes a customer device.
 * Endpoint: DELETE /api/customer-devices/{id}
 * @param {number} customerDeviceId
 * @returns {Promise<void>}
 */
export const deleteCustomerDevice = async (customerDeviceId) => {
    await apiClient.delete(`/customer-devices/${customerDeviceId}`);
};

/**
 * Fetches all available device types for base-device creation form.
 * Endpoint: GET /api/customer-devices/devices/types
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchDeviceTypes = async () => {
    const response = await apiClient.get('/customer-devices/devices/types');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches all available device producers for base-device creation form.
 * Endpoint: GET /api/customer-devices/devices/producers
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchDeviceProducers = async () => {
    const response = await apiClient.get('/customer-devices/devices/producers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches all available device purposes for base-device creation form.
 * Endpoint: GET /api/customer-devices/devices/purposes
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchDevicePurposes = async () => {
    const response = await apiClient.get('/customer-devices/devices/purposes');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Creates a new device type dictionary value.
 * Endpoint: POST /api/customer-devices/devices/types
 * @param {string} name
 * @returns {Promise<{id:number,name:string}>}
 */
export const createDeviceType = async (name) => {
    const response = await apiClient.post('/customer-devices/devices/types', { name });
    return response.data;
};

/**
 * Creates a new producer dictionary value.
 * Endpoint: POST /api/customer-devices/devices/producers
 * @param {string} name
 * @returns {Promise<{id:number,name:string}>}
 */
export const createDeviceProducer = async (name) => {
    const response = await apiClient.post('/customer-devices/devices/producers', { name });
    return response.data;
};

/**
 * Creates a new device purpose dictionary value.
 * Endpoint: POST /api/customer-devices/devices/purposes
 * @param {string} name
 * @returns {Promise<{id:number,name:string}>}
 */
export const createDevicePurpose = async (name) => {
    const response = await apiClient.post('/customer-devices/devices/purposes', { name });
    return response.data;
};

/**
 * Creates a base device catalog entity.
 * Endpoint: POST /api/customer-devices/devices
 * @param {{
 *   deviceModel:string,
 *   deviceTypeId:number,
 *   producerId:number,
 *   devicePurposeId?:number
 * }} payload
 * @returns {Promise<{id:number,deviceModel:string,deviceType:string,producer:string,devicePurpose?:string}>}
 */
export const createBaseDevice = async (payload) => {
    const response = await apiClient.post('/customer-devices/devices', payload);
    return response.data;
};

/**
 * Deletes a base device from catalog.
 * Endpoint: DELETE /api/customer-devices/devices/{id}
 * @param {number} deviceId
 * @returns {Promise<void>}
 */
export const deleteBaseDevice = async (deviceId) => {
    await apiClient.delete(`/customer-devices/devices/${deviceId}`);
};
