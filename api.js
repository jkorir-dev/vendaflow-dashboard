const isGitHubPages = window.location.hostname.includes('github.io');
const BASE_URL = isGitHubPages ? 'local' : 'http://localhost:3000/products';
const CURRENCY_API_URL = 'https://er-api.com';

function getLocalStorageData() {
    return JSON.parse(localStorage.getItem('vendaflow_db_products')) || [];
}

export async function fetchProducts() {
    if (BASE_URL === 'local') {
        return getLocalStorageData();
    }
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
    if (BASE_URL === 'local') {
        const products = getLocalStorageData();
        const newProduct = { id: Date.now().toString(), ...productData };
        products.push(newProduct);
        localStorage.setItem('vendaflow_db_products', JSON.stringify(products));
        return newProduct;
    }
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
    if (BASE_URL === 'local') {
        const products = getLocalStorageData();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedFields };
            localStorage.setItem('vendaflow_db_products', JSON.stringify(products));
            return products[index];
        }
        throw new Error('Product not found');
    }
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
    if (BASE_URL === 'local') {
        let products = getLocalStorageData();
        products = products.filter(p => p.id !== id);
        localStorage.setItem('vendaflow_db_products', JSON.stringify(products));
        return true;
    }
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
