export const APP_ROLES = {
    MASTER: 'MASTER',
    ADMIN: 'ADMIN',
    SENIOR_ADMIN: 'SENIOR_ADMIN',
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    GUEST: 'GUEST',
};

/**
 * Normalizes backend role values into frontend role constants.
 * Supports values with and without ROLE_ prefix.
 * @param {string | null | undefined} role
 * @returns {string}
 */
export const normalizeRole = (role) => {
    if (!role) return APP_ROLES.GUEST;

    const value = String(role).trim();

    if (value.includes('Системний адміністратор') || value === 'ROLE_SYSTEM_ADMIN') {
        return APP_ROLES.SYSTEM_ADMIN;
    }

    if (value.includes('Старший адміністратор') || value === 'ROLE_SENIOR_ADMIN' || value === 'SENIOR_ADMIN') {
        return APP_ROLES.SENIOR_ADMIN;
    }

    if (value === 'Адміністратор' || value === 'ROLE_Адміністратор' || value === 'ROLE_ADMIN' || value === 'ADMIN') {
        return APP_ROLES.ADMIN;
    }

    if (value === 'Майстер' || value === 'ROLE_Майстер' || value === 'ROLE_TECHNICIAN' || value === 'MASTER') {
        return APP_ROLES.MASTER;
    }

    return APP_ROLES.GUEST;
};

/**
 * Returns the default landing route for a normalized role.
 * @param {string} role
 * @returns {string}
 */
export const getDefaultRouteForRole = (role) => {
    switch (role) {
        case APP_ROLES.MASTER:
        case APP_ROLES.ADMIN:
        case APP_ROLES.SENIOR_ADMIN:
            return '/repairs/active';
        case APP_ROLES.SYSTEM_ADMIN:
            return '/management/users';
        default:
            return '/login';
    }
};
