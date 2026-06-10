import apiClient from '../app/auth/axiosConfig';
import AuthService from '../app/auth/AuthService';

/**
 * Maps Ukrainian status string from the backend to the internal STATUS_CONFIG key.
 * @param {string} status - Status string from the API response.
 * @returns {string} - Internal status key for STATUS_CONFIG.
 */
const mapStatusToKey = (status) => {
    const STATUS_MAP = {
        'нове': 'NEW',
        'діагностика': 'DIAGNOSTICS',
        'очікує підтвердження': 'AWAITING_CONFIRMATION',
        'очікує ремонт': 'AWAITING_REPAIR',
        'чекає ремонту': 'AWAITING_REPAIR',
        'в ремонті': 'IN_REPAIR',
        'до отримання': 'READY_FOR_PICKUP',
    };
    return STATUS_MAP[status?.toLowerCase()] || 'NEW';
};

/**
 * Formats an ISO datetime string to the display format "дд.мм.рррр гг:мм".
 * @param {string|null} isoString
 * @returns {string}
 */
const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Normalizes a raw diagnostic API response into the internal diagnostic shape.
 * defects are kept as {id, name} objects so the panel can send IDs back to the API.
 * @param {object} data - Raw API response body.
 * @returns {object}
 */
const normalizeDiagnostic = (data) => ({
    id: data.id,
    defectReason: data.defectReason ?? null,
    defectSolution: data.defectSolution ?? null,
    diagnosticStartedAt: data.diagnosticStartedAt ? formatDateTime(data.diagnosticStartedAt) : null,
    diagnosticFinishedAt: data.diagnosticFinishedAt ? formatDateTime(data.diagnosticFinishedAt) : null,
    workerId: data.workerId ?? null,
    workerFullName: data.workerFullName ?? null,
    defects: Array.isArray(data.defects)
        ? data.defects.filter((item) => item?.id != null).map((item) => ({ id: item.id, name: item.name }))
        : [],
});

/**
 * Fetches archived repair orders (statuses: виконано / відмовлено).
 * Endpoint: GET /api/orders/archive
 * @returns {Promise<Array>} Raw list — field names match the API response directly.
 */
export const fetchArchivedOrders = async () => {
    const response = await apiClient.get('/orders/archive');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches active repair orders for the current worker's branch.
 * Endpoint: GET /api/orders/active
 * @returns {Promise<Array>} Normalized list of orders for the UI.
 */
export const fetchActiveOrders = async () => {
    const response = await apiClient.get('/orders/active');

    // Normalize API response to internal order shape
    return response.data.map((item) => ({
        routeId: item.id ?? item.orderNumber,
        id: item.orderNumber,
        status: mapStatusToKey(item.orderStatus),   // internal key for color config
        statusLabel: item.orderStatus,              // original DB string — displayed as-is
        deviceType: item.deviceType,                // for device type filter
        producer: item.producer,                    // for producer filter
        serialNumber: item.deviceSerialNumber,
        deviceInfo: `${item.deviceType}, ${item.producer}, ${item.deviceModel}`,
        createdAt: formatDateTime(item.orderCreationTime),
        createdAtRaw: item.orderCreationTime,       // ISO string — for date filter & sorting
        amount: item.orderEstimatedPrice,          // may be null
        description: item.problemDescription ?? '',
    }));
};

/**
 * Fetches repair orders available for the current master to take — statuses NEW or AWAITING_REPAIR,
 * filtered by the master's branch. Includes diagnostic results if already performed.
 * Endpoint: GET /api/orders/available
 * @returns {Promise<Array>} Normalized list of available orders for the UI.
 */
export const fetchAvailableOrders = async () => {
    const response = await apiClient.get('/orders/available');

    return response.data.map((item) => ({
        routeId: item.orderNumber,
        id: item.orderNumber,
        status: mapStatusToKey(item.orderStatus),
        statusLabel: item.orderStatus,
        deviceType: item.deviceType,
        producer: item.producer,
        serialNumber: '',               // not provided by this endpoint
        deviceInfo: `${item.deviceType}, ${item.producer}, ${item.deviceModel}`,
        createdAt: formatDateTime(item.orderCreationTime),
        createdAtRaw: item.orderCreationTime,
        amount: null,                   // not provided by this endpoint
        description: item.problemDescription ?? '',
        diagnosticReason: item.diagnosticReason ?? null,
        diagnosticSolution: item.diagnosticSolution ?? null,
        diagnosticFinishedAt: item.diagnosticFinishedAt ? formatDateTime(item.diagnosticFinishedAt) : null,
    }));
};

/**
 * Fetches all active orders assigned to the authenticated master (WorkerId matches current user).
 * Used for the master's "In Progress" tab.
 * Endpoint: GET /api/orders/my
 * @returns {Promise<Array>} Normalized list of the master's own orders for the UI.
 */
export const fetchMyOrders = async () => {
    const response = await apiClient.get('/orders/my');

    return response.data.map((item) => ({
        routeId: item.orderNumber,
        id: item.orderNumber,
        status: mapStatusToKey(item.orderStatus),
        statusLabel: item.orderStatus,
        deviceType: item.deviceTypeName,        // /orders/my uses deviceTypeName
        producer: item.producerName,            // /orders/my uses producerName
        serialNumber: item.deviceSerialNumber ?? '',
        deviceInfo: `${item.deviceTypeName}, ${item.producerName}, ${item.deviceModel}`,
        createdAt: formatDateTime(item.orderCreationTime),
        createdAtRaw: item.orderCreationTime,
        amount: item.orderEstimatedPrice,
        description: item.problemDescription ?? '',
    }));
};

/**
 * Creates a new repair order.
 * Endpoint: POST /api/orders
 * @param {{customerDeviceId:number,problemDescription?:string}} payload
 * @returns {Promise<object>}
 */
export const createOrder = async (payload) => {
    const workerId = Number(AuthService.getWorkerId());
    if (!Number.isFinite(workerId) || workerId <= 0) {
        throw new Error('Worker ID is missing in session. Please sign in again.');
    }

    const response = await apiClient.post('/orders', {
        customerDeviceId: payload.customerDeviceId,
        workerId,
        problemDescription: payload.problemDescription,
    });

    return response.data;
};

/**
 * Fetches full details of a repair order by order number.
 * Endpoint: GET /api/orders/{orderNumber}
 * @param {string} orderNumber
 * @returns {Promise<object>} Normalized order details object for UI.
 */
export const fetchOrderDetails = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}`);
    const data = response.data;

    return {
        id: data.id,
        orderNumber: data.orderNumber,
        status: mapStatusToKey(data.orderStatus),
        statusLabel: data.orderStatus,
        createdAt: formatDateTime(data.orderCreationTime),
        createdAtRaw: data.orderCreationTime,
        createdBy: data.workerFullName,
        problemDescription: data.problemDescription,
        deviceInfo: {
            serialNumber: data.deviceSerialNumber,
            model: data.deviceModel,
            typeName: data.deviceTypeName,
            producerName: data.producerName,
            outerState: data.externalConditionDescription,
            additionalInfo: data.deviceAdditionalInfo ?? null,
        },
        customerInfo: {
            fullName: data.customerFullName,
            phoneNumber: data.customerPhoneNumber,
            email: data.customerEmail,
        },
    };
};

/**
 * Deletes a repair order. Allowed only when status is 'нове' AND less than 1 hour has passed since creation.
 * Endpoint: DELETE /api/orders/{orderNumber}
 * @param {string} orderNumber
 * @returns {Promise<void>}
 * @throws On 403 if status is not 'нове' or time limit exceeded; on 404 if not found
 */
export const deleteOrder = async (orderNumber) => {
    await apiClient.delete(`/orders/${encodeURIComponent(orderNumber)}`);
};

/**
 * Downloads repair ticket PDF for an order number.
 * Endpoint: GET /api/orders/{orderNumber}/ticket
 * @param {string} orderNumber
 * @returns {Promise<{blob: Blob, fileName: string}>}
 */
export const downloadOrderTicket = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/ticket`, {
        responseType: 'blob',
    });

    const header = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
    const fallbackName = `ticket-${orderNumber}.pdf`;

    let fileName = fallbackName;
    const utf8Match = header?.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiMatch = header?.match(/filename="?([^";]+)"?/i);
    if (utf8Match?.[1]) {
        fileName = decodeURIComponent(utf8Match[1]);
    } else if (asciiMatch?.[1]) {
        fileName = asciiMatch[1];
    }

    return {
        blob: response.data,
        fileName,
    };
};

/**
 * Fetches child entities presence flags for diagnostics and repairs.
 * Endpoint: GET /api/orders/{orderNumber}/children
 * @param {string} orderNumber
 * @returns {Promise<{hasDiagnostic: boolean, hasRepair: boolean}>}
 */
export const fetchOrderChildren = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/children`);
    return {
        hasDiagnostic: Boolean(response.data?.hasDiagnostic),
        hasRepair: Boolean(response.data?.hasRepair),
    };
};

/**
 * Fetches diagnostic details for an order.
 * Endpoint: GET /api/orders/{orderNumber}/diagnostic
 * @param {string} orderNumber
 * @returns {Promise<object>}
 */
export const fetchOrderDiagnostic = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/diagnostic`);
    const data = response.data;

    return normalizeDiagnostic(data);
};

/**
 * Starts diagnostics for the order.
 * Endpoint: POST /api/orders/{orderNumber}/diagnostic
 * @param {string} orderNumber
 * @returns {Promise<object>} Normalized diagnostic object.
 */
export const startOrderDiagnostic = async (orderNumber) => {
    const response = await apiClient.post(`/orders/${encodeURIComponent(orderNumber)}/diagnostic`);
    return normalizeDiagnostic(response.data);
};

/**
 * Finishes diagnostics — saves defect reason, solution and linked defect IDs.
 * Endpoint: PATCH /api/orders/{orderNumber}/diagnostic
 * Trigger: sets order status to "очікує підтвердження" automatically.
 * @param {string} orderNumber
 * @param {{ defectReason?: string, defectSolution?: string, defectIds?: number[] }} payload
 * @returns {Promise<object>} Normalized updated diagnostic object.
 */
export const finishOrderDiagnostic = async (orderNumber, payload) => {
    const response = await apiClient.patch(`/orders/${encodeURIComponent(orderNumber)}/diagnostic`, {
        defectReason: payload.defectReason || null,
        defectSolution: payload.defectSolution || null,
        defectIds: payload.defectIds ?? [],
    });
    return normalizeDiagnostic(response.data);
};

/**
 * Saves diagnostic draft fields without finishing diagnostics.
 * Endpoint: PATCH /api/orders/{orderNumber}/diagnostic/draft
 * @param {string} orderNumber
 * @param {{ defectReason?: string, defectSolution?: string, defectIds?: number[] }} payload
 * @returns {Promise<object>} Normalized updated diagnostic object.
 */
export const saveOrderDiagnosticDraft = async (orderNumber, payload) => {
    const response = await apiClient.patch(`/orders/${encodeURIComponent(orderNumber)}/diagnostic/draft`, {
        defectReason: payload.defectReason || null,
        defectSolution: payload.defectSolution || null,
        defectIds: payload.defectIds ?? [],
    });
    return normalizeDiagnostic(response.data);
};

/**
 * Fetches all available repair priorities.
 * Endpoint: GET /api/repair-priorities
 * @returns {Promise<Array<{id:number,value:string}>>}
 */
export const fetchRepairPriorities = async () => {
    const response = await apiClient.get('/repair-priorities');
    if (!Array.isArray(response.data)) return [];

    return response.data
        .filter((item) => item?.id != null && item?.value)
        .map((item) => ({ id: Number(item.id), value: item.value }));
};

/**
 * Completes an order — transitions status from "до отримання" to completed.
 * Endpoint: PATCH /api/orders/{orderNumber}/complete
 * @param {string} orderNumber
 * @returns {Promise<void>}
 * @throws On 403 if order status is not "до отримання"
 */
export const completeOrder = async (orderNumber) => {
    await apiClient.patch(`/orders/${encodeURIComponent(orderNumber)}/complete`);
};

/**
 * Declines repair execution for an order in awaiting-confirmation stage.
 * Endpoint: PATCH /api/orders/{orderNumber}/decline
 * @param {string} orderNumber
 * @returns {Promise<void>}
 */
export const declineOrderRepair = async (orderNumber) => {
    await apiClient.patch(`/orders/${encodeURIComponent(orderNumber)}/decline`);
};

/**
 * Confirms repair execution by creating one or more repair records with priorities.
 * Endpoint: POST /api/orders/{orderNumber}/repair
 * @param {string} orderNumber
 * @param {Array<{priorityId:number}>} repairs
 * @returns {Promise<Array<{id:number,priority:string}>>}
 */
export const confirmOrderRepairs = async (orderNumber, repairs) => {
    const response = await apiClient.post(`/orders/${encodeURIComponent(orderNumber)}/repair`, {
        repairs,
    });

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches service catalog available for the authenticated master.
 * Endpoint: GET /api/services/my
 * @returns {Promise<Array<{workerServiceId:number,serviceId:number,serviceName:string,estimatedPrice:number|null,categoryName:string|null,complexityValue:string|null,deviceTypeName:string|null}>>}
 */
export const fetchMyServices = async () => {
    const response = await apiClient.get('/services/my');

    const rawList = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.items)
            ? response.data.items
            : (Array.isArray(response.data?.content) ? response.data.content : []));

    const normalizedList = rawList
        .filter((item) => (item?.workerServiceId ?? item?.workerServicePK ?? item?.id) != null)
        .map((item) => ({
            workerServiceId: Number(item.workerServiceId ?? item.workerServicePK ?? item.id),
            serviceId: item.serviceId != null ? Number(item.serviceId) : null,
            serviceName: item.serviceName ?? item.name ?? '',
            estimatedPrice: item.estimatedPrice ?? item.serviceEstimatedPrice ?? null,
            categoryName: item.categoryName ?? null,
            complexityValue: item.complexityValue ?? null,
            deviceTypeName: item.deviceTypeName ?? null,
        }))
        .filter((item) => item.serviceName);

    return normalizedList;
};

/**
 * Fetches services available for the current master in a specific order context.
 * Endpoint: GET /api/orders/{orderNumber}/services/available
 * @param {string} orderNumber
 * @returns {Promise<Array<{workerServiceId:number,serviceId:number,serviceName:string,estimatedPrice:number|null,categoryName:string|null,complexityValue:string|null,deviceTypeName:string|null}>>}
 */
export const fetchAvailableOrderServices = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/services/available`);

    const rawList = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.items)
            ? response.data.items
            : (Array.isArray(response.data?.content) ? response.data.content : []));

    const normalizedList = rawList
        .filter((item) => (item?.workerServiceId ?? item?.workerServicePK ?? item?.id) != null)
        .map((item) => ({
            workerServiceId: Number(item.workerServiceId ?? item.workerServicePK ?? item.id),
            serviceId: item.serviceId != null ? Number(item.serviceId) : null,
            serviceName: item.serviceName ?? item.name ?? '',
            estimatedPrice: item.estimatedPrice ?? item.serviceEstimatedPrice ?? null,
            categoryName: item.categoryName ?? null,
            complexityValue: item.complexityValue ?? null,
            deviceTypeName: item.deviceTypeName ?? null,
        }))
        .filter((item) => item.serviceName);

    return normalizedList;
};

/**
 * Fetches all services available for an order's device type (not filtered by master).
 * Endpoint: GET /api/orders/{orderNumber}/services/all
 * @param {string} orderNumber
 * @returns {Promise<Array<{serviceId:number,serviceName:string,estimatedPrice:number|null,categoryName:string|null,complexityValue:string|null,deviceTypeName:string|null}>>}
 */
export const fetchAllOrderServices = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/services/all`);

    const rawList = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.items)
            ? response.data.items
            : (Array.isArray(response.data?.content) ? response.data.content : []));

    const normalizedList = rawList
        .filter((item) => item?.serviceId != null)
        .map((item) => ({
            serviceId: Number(item.serviceId),
            serviceName: item.serviceName ?? item.name ?? '',
            estimatedPrice: item.estimatedPrice ?? null,
            categoryName: item.categoryName ?? null,
            complexityValue: item.complexityValue ?? null,
            deviceTypeName: item.deviceTypeName ?? null,
        }))
        .filter((item) => item.serviceName);

    return normalizedList;
};

// ─── Repair status / priority maps ───────────────────────────────────────────

const REPAIR_STATUS_MAP = {
    'в роботі':             'IN_PROGRESS',
    'завершено':            'FINISHED',
    'виконано':             'FINISHED',
    'очікує':               'PENDING',
    'очікування майстра':   'PENDING',
    'замовлено компоненти': 'COMPONENTS_ORDERED',
};

const REPAIR_PRIORITY_MAP = {
    'високий': 'HIGH',
    'середній': 'MEDIUM',
    'низький':  'LOW',
};

/**
 * Normalizes a raw service item from the API (used in repair service start/finish responses).
 * @param {object} svc - Raw API service object.
 * @returns {object}
 */
const normalizeServiceItem = (svc) => ({
    id: svc.id,
    workerServiceId: svc.workerServiceId ?? null,
    serviceId: svc.serviceId ?? null,
    name: svc.name ?? '',
    workerName: svc.workerFullName ?? null,
    startedAt: svc.startedAt ? formatDateTime(svc.startedAt) : null,
    finishedAt: svc.finishedAt ? formatDateTime(svc.finishedAt) : null,
    components: Array.isArray(svc.components)
        ? svc.components.map((c) => ({
            id: c.id,
            name: c.name ?? c.model ?? '',
            categoryName: c.categoryName ?? null,
            producerName: c.producerName ?? null,
            price: c.price ?? 0,
            requiredQuantity: c.requiredQuantity ?? 0,
            stockQuantity: c.stockQuantity ?? 0,
        }))
        : [],
});

/**
 * Normalizes a raw repair object from the API into the shape expected by RepairItem.
 * @param {object} repair - Raw API repair object.
 * @returns {object}
 */
const normalizeRepair = (repair) => ({
    id: repair.id,
    statusKey: REPAIR_STATUS_MAP[repair.statusName?.toLowerCase()] ?? 'PENDING',
    statusLabel: repair.statusName ?? null,
    priorityKey: REPAIR_PRIORITY_MAP[repair.priorityValue?.toLowerCase()] ?? 'MEDIUM',
    priorityLabel: repair.priorityValue ?? null,
    startedAt: repair.startedAt ? formatDateTime(repair.startedAt) : null,
    finishedAt: repair.finishedAt ? formatDateTime(repair.finishedAt) : null,
    services: Array.isArray(repair.services)
        ? repair.services.map(normalizeServiceItem)
        : [],
});

/**
 * Fetches all repairs for an order, including nested services and components.
 * Endpoint: GET /api/orders/{orderNumber}/repairs
 * @param {string} orderNumber
 * @returns {Promise<Array>} Normalized repair list for RepairsPanel.
 */
export const fetchOrderRepairs = async (orderNumber) => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(orderNumber)}/repairs`);
    return Array.isArray(response.data)
        ? response.data.map(normalizeRepair)
        : [];
};

/**
 * Plans a service inside a specific repair and links required components.
 * Endpoint: POST /api/orders/{orderNumber}/repairs/{repairId}/services
 * @param {string} orderNumber
 * @param {number} repairId
 * @param {{workerServiceId:number, components?:Array<{componentId:number, quantity:number}>}} payload
 * @returns {Promise<object>}
 */
export const planRepairService = async (orderNumber, repairId, payload) => {
    const response = await apiClient.post(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/services`,
        {
            workerServiceId: payload.workerServiceId,
            components: Array.isArray(payload.components) ? payload.components : [],
        }
    );

    return response.data;
};

/**
 * Starts a repair service — sets startedAt timestamp and reserves components from stock.
 * Endpoint: PATCH /api/orders/{orderNumber}/repairs/{repairId}/services/{serviceId}/start
 * @param {string} orderNumber
 * @param {number} repairId
 * @param {number} serviceId
 * @returns {Promise<object>}
 * @throws {Error} On 409 if insufficient stock or service already started
 */
export const startRepairService = async (orderNumber, repairId, serviceId) => {
    const response = await apiClient.patch(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/services/${encodeURIComponent(serviceId)}/start`
    );

    return normalizeServiceItem(response.data);
};

/**
 * Pauses an in-progress repair — transitions status "в ремонті" → "очікує ремонту".
 * Endpoint: PATCH /api/orders/{orderNumber}/repairs/{repairId}/pause
 * @param {string} orderNumber
 * @param {number} repairId
 * @returns {Promise<object>} Normalized repair object with updated status.
 */
export const pauseRepair = async (orderNumber, repairId) => {
    const response = await apiClient.patch(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/pause`
    );
    return normalizeRepair(response.data);
};

/**
 * Finishes a repair — sets repairFinishedAt = now().
 * If this was the last unfinished repair, a DB trigger sets order status to "до отримання".
 * Endpoint: PATCH /api/orders/{orderNumber}/repairs/{repairId}/finish
 * @param {string} orderNumber
 * @param {number} repairId
 * @returns {Promise<object>} Normalized repair object with finishedAt set.
 * @throws {Error} On 409 if repair not started or already finished
 */
export const finishRepair = async (orderNumber, repairId) => {
    const response = await apiClient.patch(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/finish`
    );

    return normalizeRepair(response.data);
};

/**
 * Finishes a repair service — sets finishedAt timestamp.
 * Endpoint: PATCH /api/orders/{orderNumber}/repairs/{repairId}/services/{serviceId}/finish
 * @param {string} orderNumber
 * @param {number} repairId
 * @param {number} serviceId
 * @returns {Promise<object>} Normalized service item with finishedAt set.
 * @throws {Error} On 409 if service not started or already finished
 */
export const finishRepairService = async (orderNumber, repairId, serviceId) => {
    const response = await apiClient.patch(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/services/${encodeURIComponent(serviceId)}/finish`
    );

    return normalizeServiceItem(response.data);
};

/**
 * Updates planned repair service before it has been started.
 * Endpoint: PUT /api/orders/{orderNumber}/repairs/{repairId}/services/{serviceId}
 * @param {string} orderNumber
 * @param {number} repairId
 * @param {number} serviceId
 * @param {{workerServiceId:number, components?:Array<{componentId:number, quantity:number}>}} payload
 * @returns {Promise<object>}
 */
export const updateRepairService = async (orderNumber, repairId, serviceId, payload) => {
    const response = await apiClient.put(
        `/orders/${encodeURIComponent(orderNumber)}/repairs/${encodeURIComponent(repairId)}/services/${encodeURIComponent(serviceId)}`,
        {
            workerServiceId: payload.workerServiceId,
            components: Array.isArray(payload.components) ? payload.components : [],
        }
    );

    return response.data;
};
