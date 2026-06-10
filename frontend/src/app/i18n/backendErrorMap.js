import { friendlyApiError } from '../../utils/apiError';

const BACKEND_ERROR_KEY_MAP = {
    'Cannot delete customer: has linked devices': 'CANNOT_DELETE_CUSTOMER_LINKED_DEVICES',
    'Cannot delete customer device: has linked orders': 'CANNOT_DELETE_CUSTOMER_DEVICE_LINKED_ORDERS',
    'Cannot delete device: has linked customer devices': 'CANNOT_DELETE_DEVICE_LINKED_CUSTOMER_DEVICES',
};

/**
 * @param {unknown}      error           axios error
 * @param {object}       labels          localized labels object (section-level, e.g. labels.CREATE_ORDER)
 * @param {string}       fallbackMessage shown when no mapping found
 * @param {'ua'|'en'}    lang            output language for field-validation messages
 */
export const resolveBackendErrorMessage = (error, labels = {}, fallbackMessage = '', lang = 'ua') => {
    const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
    if (!apiMessage) return fallbackMessage;

    // 1. Exact i18n key match (e.g. business-logic errors)
    const i18nKey = BACKEND_ERROR_KEY_MAP[apiMessage];
    if (i18nKey && labels?.[i18nKey]) {
        return labels[i18nKey];
    }

    // 2. Field-validation message (e.g. "fullName: розмір має бути між 0 та 70")
    const friendly = friendlyApiError(apiMessage, lang);
    if (friendly && friendly !== apiMessage) {
        return friendly;
    }

    // 3. Raw backend message as last resort
    return apiMessage;
};
