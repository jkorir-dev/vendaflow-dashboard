const API_ORIGIN = globalThis.VENDAFLOW_API_URL || 'https://mockapi.io';
const BASE_URL = `${API_ORIGIN.replace(/\/$/, '')}/products`;
const CURRENCY_API_URL = 'https://er-api.com';

export async function fetchProducts() {
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error('Failed to retrieve inventory data');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

export async function createProduct(productData) {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to post product data');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function updateProductStock(id, updatedFields) {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
        });
        if (!response.ok) throw new Error('Failed to patch product state');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function deleteProductListing(id) {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to execute delete operation');
        return true;
    } catch (error) {
        console.error('API Error:', error);
        return false;
    }
}

export async function fetchExchangeRates() {
    try {
        const response = await fetch(CURRENCY_API_URL);
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error('Currency API Error:', error);
        return null;
    }
}
