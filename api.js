const configuredApiOrigin = globalThis.VENDAFLOW_API_URL;
const currentHostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
const useBrowserStorage = !configuredApiOrigin &&
    !['localhost', '127.0.0.1'].includes(currentHostname);
const API_ORIGIN = (configuredApiOrigin || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/products`;
const CURRENCY_API_URL = 'https://er-api.com';
const PRODUCTS_STORAGE_KEY = 'vendaflow_db_products';

function readStoredProducts() {
    try {
        return JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveStoredProducts(products) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

export async function fetchProducts() {
    if (useBrowserStorage) return readStoredProducts();

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
    if (useBrowserStorage) {
        const products = readStoredProducts();
        const product = { ...productData, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` };
        products.push(product);
        saveStoredProducts(products);
        return product;
    }

    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error(`Failed to post product data (${response.status} ${response.statusText})`);
    return response.json();
}

export async function updateProductStock(id, updatedFields) {
    if (useBrowserStorage) {
        const products = readStoredProducts();
        const index = products.findIndex(product => String(product.id) === String(id));
        if (index < 0) throw new Error('Product not found');
        products[index] = { ...products[index], ...updatedFields };
        saveStoredProducts(products);
        return products[index];
    }

    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
    });
    if (!response.ok) throw new Error(`Failed to patch product state (${response.status})`);
    return response.json();
}

export async function deleteProductListing(id) {
    if (useBrowserStorage) {
        const products = readStoredProducts();
        const remaining = products.filter(product => String(product.id) !== String(id));
        if (remaining.length === products.length) return false;
        saveStoredProducts(remaining);
        return true;
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
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
