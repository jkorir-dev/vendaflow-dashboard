const configuredApiOrigin = globalThis.VENDAFLOW_API_URL;
const currentHostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
const SUPABASE_URL = (globalThis.VENDAFLOW_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = globalThis.VENDAFLOW_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const useBrowserStorage = !isSupabaseConfigured && !configuredApiOrigin &&
    !['localhost', '127.0.0.1'].includes(currentHostname);
const API_ORIGIN = (configuredApiOrigin || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/products`;
const SUPABASE_PRODUCTS_URL = `${SUPABASE_URL}/rest/v1/products`;
const CURRENCY_API_URL = 'https://er-api.com';
const PRODUCTS_STORAGE_KEY = 'vendaflow_products';
const SUPABASE_SESSION_KEY = 'vendaflow_supabase_session';

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

function readSupabaseSession() {
    try {
        return JSON.parse(localStorage.getItem(SUPABASE_SESSION_KEY));
    } catch (error) {
        return null;
    }
}

function saveSupabaseSession(session) {
    if (session) {
        localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(SUPABASE_SESSION_KEY);
    }
}

async function supabaseRequest(path, options = {}, accessToken = SUPABASE_ANON_KEY) {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    const responseText = await response.text();
    let responseBody = null;
    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch (error) {
            responseBody = responseText;
        }
    }

    if (!response.ok) {
        const message = responseBody?.msg || responseBody?.message || responseBody?.error_description || responseBody?.error || response.statusText;
        throw new Error(`Supabase request failed (${response.status}): ${message}`);
    }

    return responseBody;
}

export async function getSupabaseSession() {
    if (!isSupabaseConfigured) return null;

    const session = readSupabaseSession();
    if (!session?.access_token || !session?.refresh_token) return null;

    const expiresAt = Number(session.expires_at || 0);
    if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;

    try {
        const refreshedSession = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        saveSupabaseSession(refreshedSession);
        return refreshedSession;
    } catch (error) {
        saveSupabaseSession(null);
        console.error('Supabase session refresh failed:', error);
        return null;
    }
}

export async function signInUser(email, password) {
    const session = await supabaseRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    saveSupabaseSession(session);
    return session;
}

export async function signUpUser(email, password, username) {
    const result = await supabaseRequest('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, data: { username } })
    });

    if (result?.access_token) saveSupabaseSession(result);
    return result;
}

export async function signOutUser() {
    const session = await getSupabaseSession();
    try {
        if (session?.access_token) {
            await supabaseRequest('/auth/v1/logout', { method: 'POST' }, session.access_token);
        }
    } finally {
        saveSupabaseSession(null);
    }
}

function getSessionUserId(session) {
    return session?.user?.id || session?.id || null;
}

async function supabaseProductsRequest(path = '', options = {}) {
    const session = await getSupabaseSession();
    if (!session?.access_token) throw new Error('Please sign in again to access your inventory.');
    return supabaseRequest(`${SUPABASE_PRODUCTS_URL}${path}`, options, session.access_token);
}

export async function fetchProducts() {
    if (isSupabaseConfigured) {
        if (!await getSupabaseSession()) return [];
        return supabaseProductsRequest('?select=*&order=created_at.desc');
    }
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
    if (isSupabaseConfigured) {
        const session = await getSupabaseSession();
        const ownerId = getSessionUserId(session);
        if (!ownerId) throw new Error('Please sign in again to save inventory.');

        const { id, ...product } = productData;
        const savedProducts = await supabaseProductsRequest('', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ ...product, owner_id: ownerId })
        });
        return savedProducts[0];
    }

    if (useBrowserStorage) {
        const products = readStoredProducts();
        const product = { ...productData, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` };
        products.push(product);
        saveStoredProducts(products);
        return product;
    }

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error(`Failed to post product data (${response.status} ${response.statusText})`);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function updateProductStock(id, updatedFields) {
    if (isSupabaseConfigured) {
        const session = await getSupabaseSession();
        const ownerId = getSessionUserId(session);
        const updatedProducts = await supabaseProductsRequest(`?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(ownerId)}&select=*`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify(updatedFields)
        });
        if (!updatedProducts.length) throw new Error('Product not found or access denied.');
        return updatedProducts[0];
    }

    if (useBrowserStorage) {
        const products = readStoredProducts();
        const productIndex = products.findIndex(product => String(product.id) === String(id));
        if (productIndex < 0) throw new Error('Product not found');
        products[productIndex] = { ...products[productIndex], ...updatedFields };
        saveStoredProducts(products);
        return products[productIndex];
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
    if (isSupabaseConfigured) {
        try {
            const session = await getSupabaseSession();
            const ownerId = getSessionUserId(session);
            await supabaseProductsRequest(`?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(ownerId)}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('Supabase delete error:', error);
            return false;
        }
    }

    if (useBrowserStorage) {
        const products = readStoredProducts();
        const remainingProducts = products.filter(product => String(product.id) !== String(id));
        if (remainingProducts.length === products.length) return false;
        saveStoredProducts(remainingProducts);
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
