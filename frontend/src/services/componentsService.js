import apiClient from '../app/auth/axiosConfig';

/**
 * Fetches all component categories.
 * Endpoint: GET /api/components/categories
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchComponentCategories = async () => {
    const response = await apiClient.get('/components/categories');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches all component producers.
 * Endpoint: GET /api/components/producers
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
export const fetchComponentProducers = async () => {
    const response = await apiClient.get('/components/producers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches the minimum and maximum component prices.
 * Endpoint: GET /api/components/price-range
 * @returns {Promise<{minPrice:number,maxPrice:number}>}
 */
export const fetchComponentPriceRange = async () => {
    const response = await apiClient.get('/components/price-range');
    const data = response.data ?? {};

    return {
        minPrice: Number(data.minPrice ?? 0),
        maxPrice: Number(data.maxPrice ?? 0),
    };
};

/**
 * Fetches filtered components for the catalog picker.
 * Endpoint: GET /api/components
 * @param {{producerId?:number|null,categoryId?:number|string|null,minPrice?:number,maxPrice?:number,search?:string}} filters
 * @returns {Promise<Array<{id:number,name:string,price:number,producerId?:number,producerName?:string,categoryId?:number,categoryName?:string,warrantyPeriod?:number}>>}
 */
export const fetchComponents = async (filters = {}) => {
    const params = {};

    if (filters.producerId != null && filters.producerId !== '') {
        params.producerId = filters.producerId;
    }

    if (filters.categoryId != null && filters.categoryId !== '') {
        params.categoryId = filters.categoryId;
    }

    if (filters.minPrice != null && filters.minPrice !== '') {
        params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice != null && filters.maxPrice !== '') {
        params.maxPrice = filters.maxPrice;
    }

    const search = (filters.search ?? '').trim();
    if (search) {
        params.search = search;
    }

    const response = await apiClient.get('/components', { params });
    return Array.isArray(response.data) ? response.data : [];
};