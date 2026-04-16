// ─── Field name labels ────────────────────────────────────────────────────────

const FIELD_LABELS_UK = {
    address:        'Адреса',
    phoneNumber:    'Номер телефону',
    email:          'Email',
    fullName:       'ПІБ',
    companyName:    'Назва компанії',
    serviceName:    'Назва послуги',
    estimatedPrice: 'Ціна послуги',
    name:           'Назва',
    password:       'Пароль',
    componentModel: 'Модель компонента',
    deviceModel:    'Модель пристрою',
    invoiceNumber:  'Номер накладної',
    quantity:       'Кількість',
    warrantyPeriod: 'Гарантійний термін',
    componentPrice: 'Ціна компонента',
    unitPrice:      'Ціна за одиницю',
};

const FIELD_LABELS_EN = {
    address:        'Address',
    phoneNumber:    'Phone number',
    email:          'Email',
    fullName:       'Full name',
    companyName:    'Company name',
    serviceName:    'Service name',
    estimatedPrice: 'Service price',
    name:           'Name',
    password:       'Password',
    componentModel: 'Component model',
    deviceModel:    'Device model',
    invoiceNumber:  'Invoice number',
    quantity:       'Quantity',
    warrantyPeriod: 'Warranty period',
    componentPrice: 'Component price',
    unitPrice:      'Unit price',
};

// ─── Constraint message patterns (Hibernate Validator, uk locale) ─────────────

/**
 * Converts a raw backend validation error string (e.g. "address: розмір має бути між 0 та 100")
 * into a user-friendly message in the requested language.
 *
 * @param {string}       raw   - e?.response?.data?.error
 * @param {'ua' | 'en'}  lang
 * @returns {string}
 */
export const friendlyApiError = (raw, lang = 'ua') => {
    if (!raw) return '';

    // ── Try to parse "fieldName: constraintMessage" ───────────────────────────
    const match = raw.match(/^(\w+):\s+(.+)$/);
    if (!match) return raw;

    const [, field, constraint] = match;
    const labels = lang === 'en' ? FIELD_LABELS_EN : FIELD_LABELS_UK;
    const label = labels[field] ?? field;
    const isEn  = lang === 'en';

    // Size: "розмір має бути між X та Y"
    const sizeMatch = constraint.match(/(?:розмір має бути між|size must be between)\s+(\d+)\s+(?:та|and)\s+(\d+)/i);
    if (sizeMatch) {
        const [, min, max] = sizeMatch;
        if (min === '0' || min === '1') {
            return isEn
                ? `${label}: maximum ${max} characters allowed`
                : `${label}: довжина не більше ${max} символів`;
        }
        return isEn
            ? `${label}: length must be between ${min} and ${max} characters`
            : `${label}: довжина від ${min} до ${max} символів`;
    }

    // Not blank / not null
    if (/(?:не може бути порожнім|не може бути null|must not be blank|must not be null|must not be empty)/i.test(constraint)) {
        return isEn ? `${label}: field is required` : `${label}: поле обов'язкове`;
    }

    // Email format
    if (/(?:має бути дійсною адресою електронної пошти|must be a well-formed email address)/i.test(constraint)) {
        return isEn ? `Email: invalid email format` : `Email: невірний формат адреси`;
    }

    // Min numeric value: "має бути більше або рівне X"
    const minMatch = constraint.match(/(?:має бути більше або рівне|must be greater than or equal to)\s+([\d.]+)/i);
    if (minMatch) {
        return isEn
            ? `${label}: minimum value is ${minMatch[1]}`
            : `${label}: мінімальне значення — ${minMatch[1]}`;
    }

    // Max numeric value: "має бути менше або рівне X"
    const maxMatch = constraint.match(/(?:має бути менше або рівне|must be less than or equal to)\s+([\d.]+)/i);
    if (maxMatch) {
        return isEn
            ? `${label}: maximum value is ${maxMatch[1]}`
            : `${label}: максимальне значення — ${maxMatch[1]}`;
    }

    // Positive: "має бути більше нуля"
    if (/(?:має бути більше нуля|must be greater than 0)/i.test(constraint)) {
        return isEn ? `${label}: must be positive` : `${label}: має бути більше нуля`;
    }

    // Unique / already exists passthrough (backend sends a ready message)
    if (/(?:вже існує|already exists|duplicate|унікальн)/i.test(raw)) {
        return raw;
    }

    // ── Fallback: friendly field label + original constraint ──────────────────
    return `${label}: ${constraint}`;
};

/**
 * Convenience wrapper: extracts `error` or `message` from an axios error
 * and runs it through friendlyApiError. Falls back to `fallback` string.
 *
 * @param {unknown}      axiosError
 * @param {string}       fallback
 * @param {'ua' | 'en'}  lang
 * @returns {string}
 */
export const getApiErrorMessage = (axiosError, fallback, lang = 'ua') => {
    const raw = axiosError?.response?.data?.error ?? axiosError?.response?.data?.message;
    return raw ? (friendlyApiError(raw, lang) || raw) : fallback;
};
