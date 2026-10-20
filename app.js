import { fetchProducts, createProduct, updateProductStock, deleteProductListing, fetchExchangeRates } from './api.js';

let appInventory = [];

const entryForm = document.getElementById('product-entry-form');
const searchInput = document.getElementById('catalog-search');
const displayGrid = document.getElementById('inventory-grid');

const grossSalesEl = document.getElementById('metric-gross');
const platformFeesEl = document.getElementById('metric-fees');
const netPayoutEl = document.getElementById('metric-net');

const loginForm = document.getElementById('inline-login-form');
const signupForm = document.getElementById('inline-signup-form');
const toggleSignupBtn = document.getElementById('btn-toggle-signup');
const cancelSignupBtn = document.getElementById('btn-cancel-signup');
const logoutBtn = document.getElementById('btn-logout');
const loggedOutView = document.getElementById('auth-logged-out');
const loggedInView = document.getElementById('auth-logged-in');
const userDisplay = document.getElementById('user-display-name');

async function initializeDashboard() {
    checkAuthStatus();
    window.currentExchangeRates = await fetchExchangeRates();
    appInventory = await fetchProducts();
    updateFinancialAnalytics();
    renderInventoryCatalog(appInventory);
}

function checkAuthStatus() {
    const cachedUser = localStorage.getItem('vendaflow_session_user');
    if (cachedUser) {
        showLoggedInState(cachedUser);
    } else {
        showLoggedOutState();
    }
}

async function showLoggedInState(username) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'flex';
    userDisplay.textContent = username;
    appInventory = await fetchProducts();
    updateFinancialAnalytics();
    renderInventoryCatalog(appInventory);
}

function showLoggedOutState() {
    loggedInView.style.display = 'none';
    loggedOutView.style.display = 'flex';
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
    
    grossSalesEl.textContent = "KSh 0.00";
    platformFeesEl.textContent = "KSh 0.00";
    netPayoutEl.textContent = "KSh 0.00";
    renderInventoryCatalog([]);
}

if (toggleSignupBtn && cancelSignupBtn) {
    toggleSignupBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    });
    cancelSignupBtn.addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value;

        const usersDb = JSON.parse(localStorage.getItem('vendaflow_users')) || [];
        const matchingUser = usersDb.find(user => user.username === usernameInput && user.password === passwordInput);

        if (matchingUser) {
            localStorage.setItem('vendaflow_session_user', usernameInput);
            showLoggedInState(usernameInput);
        } else {
            alert('Access Denied: Invalid username or password. Please Sign Up first!');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newUsername = document.getElementById('signup-username').value.trim();
        const newPassword = document.getElementById('signup-password').value;

        const usersDb = JSON.parse(localStorage.getItem('vendaflow_users')) || [];
        const userExists = usersDb.some(user => user.username === newUsername);

        if (userExists) {
            alert('Username is already taken!');
            return;
        }

        usersDb.push({ username: newUsername, password: newPassword });
        localStorage.setItem('vendaflow_users', JSON.stringify(usersDb));
        
        localStorage.setItem('vendaflow_session_user', newUsername);
        showLoggedInState(newUsername);
        
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vendaflow_session_user');
        showLoggedOutState();
    });
}

function updateFinancialAnalytics() {
    const PLATFORM_FEE_RATE = 0.10;

    const totalGrossRevenue = appInventory.reduce((accumulator, item) => {
        return accumulator + (Number(item.retailPrice) * Number(item.stockQuantity));
    }, 0);

    const accumulatedFees = totalGrossRevenue * PLATFORM_FEE_RATE;
    const computedNetPayout = totalGrossRevenue - accumulatedFees;

    grossSalesEl.textContent = `KSh ${totalGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    platformFeesEl.textContent = `KSh ${accumulatedFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    netPayoutEl.textContent = `KSh ${computedNetPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function renderInventoryCatalog(productsList) {
    displayGrid.innerHTML = '';

    const activeUserSession = localStorage.getItem('vendaflow_session_user');
    if (!activeUserSession) {
        displayGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f1f5f9;">
                <span style="font-size: 3rem;">🔒</span>
                <h3 style="margin-top: 1rem; color: #1e293b;">Catalog Hidden</h3>
                <p style="color: #64748b; margin-top: 0.25rem;">Please Log In or Sign Up above to view your active product inventory.</p>
            </div>
        `;
        return;
    }

    if (productsList.length === 0) {
        displayGrid.innerHTML = '<p class="empty-state">No matching inventory items found.</p>';
        return;
    }

    productsList.forEach(item => {
        const cardNode = document.createElement('div');
        const isOutOfStock = Number(item.stockQuantity) <= 0;
        
        cardNode.className = 'product-profile-card';
        cardNode.style.border = '1px solid #cbd5e1';
        cardNode.style.padding = '1rem';
        cardNode.style.borderRadius = '6px';
        cardNode.style.background = isOutOfStock ? '#fee2e2' : '#ffffff';
        cardNode.style.marginBottom = '1rem';

        const KES_TO_USD_RATE = 130.00;
        const liveRates = window.currentExchangeRates;
        const conversionRate = liveRates && liveRates.KES ? Number(liveRates.KES) : KES_TO_USD_RATE;
        const priceInUSD = (Number(item.retailPrice) / (conversionRate || 130.00)).toFixed(2);

        cardNode.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background: #e2e8f0; border-radius: 4px;">${item.category}</span>
                <span style="font-size: 0.8rem; font-weight: bold; color: ${isOutOfStock ? '#ef4444' : '#10b981'};">
                    ${isOutOfStock ? 'Out of Stock' : `Stock: ${item.stockQuantity}`}
                </span>
            </div>
            <h4 style="margin-bottom: 0.25rem;">${item.title}</h4>
            <p style="font-size: 0.75rem; color: #64748b; font-family: monospace; margin-bottom: 0.25rem;">SKU: ${item.sku}</p>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem;">📅 Added: ${item.dateLogged || 'Prior Inventory'}</p>
            <div style="font-size: 0.9rem; margin-bottom: 1rem;">
                <p>Cost: <span style="font-weight: 500;">KSh ${item.wholesaleCost}</span></p>
                <p>Price: <span style="font-weight: 600; color: #2563eb;">KSh ${item.retailPrice} <small style="color:#64748b;">($${priceInUSD} USD)</small></span></p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-sale-action" style="flex: 1; padding: 0.4rem; font-size: 0.85rem; cursor: pointer;" ${isOutOfStock ? 'disabled' : ''}>Simulate Sale</button>
                <button class="btn-delete-action" style="padding: 0.4rem; font-size: 0.85rem; background: #ef4444; color: white; border: none; cursor: pointer;">Remove</button>
            </div>
        `;

        cardNode.querySelector('.btn-sale-action').addEventListener('click', () => handleSaleSimulation(item.id));
        cardNode.querySelector('.btn-delete-action').addEventListener('click', () => handleProductDeletion(item.id));

        displayGrid.appendChild(cardNode);
    });
}

if (entryForm) {
    entryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const inputTitle = document.getElementById('prod-title').value;
        const inputCategory = document.getElementById('prod-category').value;
        const inputCost = Number(document.getElementById('prod-cost').value);
        const inputRetail = Number(document.getElementById('prod-retail').value);
        const inputStock = Number(document.getElementById('prod-stock').value);
        const inputDate = document.getElementById('prod-date').value;

        const formattedDate = new Date(inputDate).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const generatedSku = `${inputCategory.substring(0, 3).toUpperCase()}-${inputTitle.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

        const newProductPayload = {
            title: inputTitle,
            category: inputCategory,
            wholesaleCost: inputCost,
            retailPrice: inputRetail,
            stockQuantity: inputStock,
            sku: generatedSku,
            dateLogged: formattedDate
        };

        try {
            const savedProduct = await createProduct(newProductPayload);
            appInventory.push(savedProduct);
updateFinancialAnalytics();
renderInventoryCatalog(appInventory);
entryForm.reset();
} catch (error) {
alert('Failed to log new inventory item.');
}
});
}

async function handleSaleSimulation(productId) {
const targetItem = appInventory.find(item => item.id === productId);
if (!targetItem || targetItem.stockQuantity <= 0) return;
const originalQuantity = targetItem.stockQuantity;
targetItem.stockQuantity -= 1;
try {
await updateProductStock(productId, { stockQuantity: targetItem.stockQuantity });
updateFinancialAnalytics();
renderInventoryCatalog(appInventory);
} catch (error) {
targetItem.stockQuantity = originalQuantity;
alert('Failed to process sale mutation.');
}
}

async function handleProductDeletion(productId) {
const userConfirmed = confirm('Are you sure you want to completely remove this listing?');
if (!userConfirmed) return;
const successfulDeletion = await deleteProductListing(productId);
if (successfulDeletion) {
appInventory = appInventory.filter(item => item.id !== productId);
updateFinancialAnalytics();
renderInventoryCatalog(appInventory);
} else {
alert('Failed to complete item deletion.');
}
}

if (searchInput) {
searchInput.addEventListener('input', (event) => {
const searchNormalizedQuery = event.target.value.toLowerCase().trim();
const filteredResults = appInventory.filter(item => {
return item.title.toLowerCase().includes(searchNormalizedQuery) ||
item.sku.toLowerCase().includes(searchNormalizedQuery);
});
renderInventoryCatalog(filteredResults);
});
}
document.addEventListener('DOMContentLoaded', initializeDashboard);