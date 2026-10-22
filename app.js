import {
    createProduct,
    deleteProductListing,
    fetchExchangeRates,
    fetchProducts,
    getSupabaseSession,
    isSupabaseConfigured,
    signInUser,
    signOutUser,
    signUpUser,
    updateProductStock
} from './api.js';

// State and DOM references
let appInventory = [];

const entryForm = document.getElementById('product-entry-form');
const stockingDateInput = document.getElementById('prod-date');
const searchInput = document.getElementById('catalog-search');
const displayGrid = document.getElementById('inventory-grid');
const whatsappReceiptNotice = document.getElementById('whatsapp-receipt-notice');

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
const signupEmailInput = document.getElementById('signup-email');

if (isSupabaseConfigured && signupEmailInput) {
    signupEmailInput.style.display = '';
    signupEmailInput.required = true;
    document.getElementById('login-username').placeholder = 'Email';
}

// Date, image, and SKU helpers
function getLocalDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isValidNonFutureDate(dateValue) {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!dateParts) return false;

    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const selectedDate = new Date(0);
    selectedDate.setUTCHours(0, 0, 0, 0);
    selectedDate.setUTCFullYear(year, month - 1, day);

    const isRealDate = selectedDate.getUTCFullYear() === year &&
        selectedDate.getUTCMonth() === month - 1 &&
        selectedDate.getUTCDate() === day;

    return isRealDate && dateValue <= getLocalDateInputValue();
}

function syncStockingDateLimit() {
    if (!stockingDateInput) return;
    stockingDateInput.max = getLocalDateInputValue();
    if (stockingDateInput.value && !isValidNonFutureDate(stockingDateInput.value)) {
        stockingDateInput.value = '';
    }
}

function convertImageToBase64(files) {
    if (!files || files.length === 0) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(files[0]);
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = reject;
    });
}

function createProductSku(category, title) {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const titleCode = title.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const uniqueSuffix = Date.now().toString().slice(-4);
    return `${categoryCode}-${titleCode}-${uniqueSuffix}`;
}

function normalizeWhatsAppNumber(phoneNumber) {
    let digits = phoneNumber.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
    if (digits.length < 8 || digits.length > 15) return null;
    return digits;
}

function createWhatsAppReceiptUrl(phoneNumber, product) {
    const receiptNumber = `VF-${Date.now().toString(36).toUpperCase()}`;
    const saleDate = new Intl.DateTimeFormat('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date());
    const message = [
        'VendaFlow digital receipt',
        `Receipt: ${receiptNumber}`,
        `Item: ${product.title}`,
        `SKU: ${product.sku}`,
        'Quantity: 1',
        `Unit price: KSh ${Number(product.retailPrice).toLocaleString('en-KE')}`,
        `Date: ${saleDate}`,
        'Thank you for shopping with us!'
    ].join('\n');

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

function showWhatsAppReceiptLink(receiptUrl) {
    if (!whatsappReceiptNotice) return;

    whatsappReceiptNotice.replaceChildren();
    whatsappReceiptNotice.hidden = false;
    whatsappReceiptNotice.append('Sale recorded. Open WhatsApp to review and send the receipt: ');

    const link = document.createElement('a');
    link.href = receiptUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open WhatsApp receipt';
    whatsappReceiptNotice.append(link);
}

function hasActiveUserSession() {
    const sessionKey = isSupabaseConfigured
        ? 'vendaflow_supabase_session'
        : 'vendaflow_session_user';
    return Boolean(localStorage.getItem(sessionKey));
}

if (stockingDateInput) {
    syncStockingDateLimit();
    stockingDateInput.addEventListener('focus', syncStockingDateLimit);
    stockingDateInput.addEventListener('input', () => {
        syncStockingDateLimit();
        stockingDateInput.setCustomValidity('');
    });
    stockingDateInput.addEventListener('change', () => {
        syncStockingDateLimit();
        stockingDateInput.setCustomValidity('');
    });
}

// Dashboard initialization and authentication
async function initializeDashboard() {
    syncStockingDateLimit();
    window.currentExchangeRates = await fetchExchangeRates();
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
        appInventory = await fetchProducts();
        updateFinancialAnalytics();
        renderInventoryCatalog(appInventory);
    }
}

async function checkAuthStatus() {
    if (isSupabaseConfigured) {
        const session = await getSupabaseSession();
        if (!session?.user) {
            showLoggedOutState();
            return false;
        }

        const username = session.user.user_metadata?.username || session.user.email;
        await showLoggedInState(username);
        return true;
    }

    const cachedUser = localStorage.getItem('vendaflow_session_user');
    if (cachedUser) {
        await showLoggedInState(cachedUser);
        return true;
    } else {
        showLoggedOutState();
        return false;
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

    grossSalesEl.textContent = 'KSh 0.00';
    platformFeesEl.textContent = 'KSh 0.00';
    netPayoutEl.textContent = 'KSh 0.00';
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
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const loginInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value;

        if (isSupabaseConfigured) {
            try {
                const session = await signInUser(loginInput, passwordInput);
                await showLoggedInState(session.user.user_metadata?.username || session.user.email);
            } catch (error) {
                alert(`Sign in failed: ${error.message}`);
            }
            return;
        }

        const usersDb = JSON.parse(localStorage.getItem('vendaflow_users')) || [];
        const matchingUser = usersDb.find(user =>
            user.username === loginInput && user.password === passwordInput
        );

        if (!matchingUser) {
            alert('Access Denied: Invalid username or password. Please Sign Up first!');
            return;
        }

        localStorage.setItem('vendaflow_session_user', loginInput);
        showLoggedInState(loginInput);
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newUsername = document.getElementById('signup-username').value.trim();
        const newPassword = document.getElementById('signup-password').value;

        if (isSupabaseConfigured) {
            const email = signupEmailInput.value.trim();
            try {
                const result = await signUpUser(email, newPassword, newUsername);
                if (!result.access_token) {
                    alert('Account created. Check your email to confirm it, then sign in.');
                    signupForm.reset();
                    signupForm.style.display = 'none';
                    loginForm.style.display = 'flex';
                    return;
                }

                await showLoggedInState(result.user.user_metadata?.username || result.user.email);
                signupForm.style.display = 'none';
                loginForm.style.display = 'flex';
            } catch (error) {
                alert(`Sign up failed: ${error.message}`);
            }
            return;
        }

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
        if (isSupabaseConfigured) {
            signOutUser()
                .catch(error => console.error('Sign out failed:', error))
                .finally(showLoggedOutState);
        } else {
            localStorage.removeItem('vendaflow_session_user');
            showLoggedOutState();
        }
    });
}

// Dashboard analytics and product catalog
function updateFinancialAnalytics() {
    if (!hasActiveUserSession()) {
        grossSalesEl.textContent = 'KSh 0.00';
        platformFeesEl.textContent = 'KSh 0.00';
        netPayoutEl.textContent = 'KSh 0.00';
        return;
    }

    const platformFeeRate = 0.10;
    const totalGrossRevenue = appInventory.reduce((total, item) =>
        total + Number(item.retailPrice) * Number(item.stockQuantity), 0
    );
    const accumulatedFees = totalGrossRevenue * platformFeeRate;
    const computedNetPayout = totalGrossRevenue - accumulatedFees;
    const currencyFormat = { minimumFractionDigits: 2 };

    grossSalesEl.textContent = `KSh ${totalGrossRevenue.toLocaleString(undefined, currencyFormat)}`;
    platformFeesEl.textContent = `KSh ${accumulatedFees.toLocaleString(undefined, currencyFormat)}`;
    netPayoutEl.textContent = `KSh ${computedNetPayout.toLocaleString(undefined, currencyFormat)}`;
}

function renderInventoryCatalog(productsList) {
    displayGrid.innerHTML = '';

    if (!hasActiveUserSession()) {
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
        const conversionRate = Number(window.currentExchangeRates?.KES) || 130;
        const priceInUSD = (Number(item.retailPrice) / conversionRate).toFixed(2);
        const productImageSrc = item.imageUrl || 'https://unsplash.com';
        const itemRating = Number(item.rating) || 5;
        let starRatingHtml = '';

        for (let starCount = 1; starCount <= 5; starCount++) {
            const starColor = starCount <= itemRating ? '#f59e0b' : '#cbd5e1';
            starRatingHtml += `<span style="color: ${starColor}; font-size: 1.1rem; margin-right: 0.1rem;">★</span>`;
        }

        cardNode.className = 'product-profile-card';
        cardNode.style.border = '1px solid #cbd5e1';
        cardNode.style.padding = '1rem';
        cardNode.style.borderRadius = '6px';
        cardNode.style.background = isOutOfStock ? '#fee2e2' : '#ffffff';
        cardNode.style.marginBottom = '1rem';
        cardNode.innerHTML = `
            <div style="width: 100%; height: 160px; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; background: #f1f5f9;">
                <img src="${productImageSrc}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background: #e2e8f0; border-radius: 4px;">${item.category}</span>
                <span style="font-size: 0.8rem; font-weight: bold; color: ${isOutOfStock ? '#ef4444' : '#10b981'};">
                    ${isOutOfStock ? 'Out of Stock' : `Stock: ${item.stockQuantity}`}
                </span>
            </div>
            <h4 style="margin-bottom: 0.25rem;">${item.title}</h4>
            <p style="font-size: 0.75rem; color: #64748b; font-family: monospace; margin-bottom: 0.25rem;">SKU: ${item.sku}</p>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem;">📅 Added: ${item.dateLogged || 'Prior Inventory'}</p>
            <div style="margin-bottom: 0.75rem; display: flex; align-items: center;">
                ${starRatingHtml} <small style="color: #64748b; margin-left: 0.4rem; font-size: 0.75rem;">(${itemRating}/5 Quality)</small>
            </div>
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

// Product entry and inventory actions
if (entryForm) {
    entryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const inputTitle = document.getElementById('prod-title').value;
        const inputCategory = document.getElementById('prod-category').value;
        const inputCost = Number(document.getElementById('prod-cost').value);
        const inputRetail = Number(document.getElementById('prod-retail').value);
        const inputStock = Number(document.getElementById('prod-stock').value);
        const inputDate = stockingDateInput.value;
        const imageFiles = document.getElementById('prod-image').files;
        const dateIsValid = isValidNonFutureDate(inputDate);

        stockingDateInput.setCustomValidity(
            dateIsValid ? '' : 'Choose a valid stocking date that is today or earlier.'
        );
        if (!stockingDateInput.reportValidity()) return;

        const formattedDate = new Date(`${inputDate}T12:00:00`).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        try {
            const imageUrl = await convertImageToBase64(imageFiles);
            const newProductPayload = {
                title: inputTitle,
                category: inputCategory,
                wholesaleCost: inputCost,
                retailPrice: inputRetail,
                stockQuantity: inputStock,
                sku: createProductSku(inputCategory, inputTitle),
                dateLogged: formattedDate,
                imageUrl,
                rating: Math.floor(Math.random() * 3) + 3
            };

            const savedProduct = await createProduct(newProductPayload);
            appInventory.push(savedProduct);
            updateFinancialAnalytics();
            renderInventoryCatalog(appInventory);
            entryForm.reset();
        } catch (error) {
            console.error('Failed to log new inventory item:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to log new inventory item: ${errorMessage}`);
        }
    });
}

async function handleSaleSimulation(productId) {
    const targetItem = appInventory.find(item => item.id === productId);
    if (!targetItem || targetItem.stockQuantity <= 0) return;

    if (whatsappReceiptNotice) {
        whatsappReceiptNotice.hidden = true;
        whatsappReceiptNotice.replaceChildren();
    }

    const buyerPhoneInput = prompt(
        'Enter the buyer’s WhatsApp number (Kenya format, e.g. 0712345678). Leave blank to skip receipt.'
    );
    let receiptUrl = null;

    if (buyerPhoneInput?.trim()) {
        const normalizedPhone = normalizeWhatsAppNumber(buyerPhoneInput.trim());
        if (!normalizedPhone) {
            alert('That WhatsApp number does not look valid. The sale will continue without a receipt.');
        } else {
            receiptUrl = createWhatsAppReceiptUrl(normalizedPhone, targetItem);
        }
    }

    const originalQuantity = targetItem.stockQuantity;
    targetItem.stockQuantity -= 1;

    try {
        await updateProductStock(productId, { stockQuantity: targetItem.stockQuantity });
        updateFinancialAnalytics();
        renderInventoryCatalog(appInventory);

        if (receiptUrl) {
            showWhatsAppReceiptLink(receiptUrl);
        }
    } catch (error) {
        targetItem.stockQuantity = originalQuantity;
        alert('Failed to process sale mutation.');
    }
}

async function handleProductDeletion(productId) {
    const userConfirmed = confirm('Are you sure you want to completely remove this listing?');
    if (!userConfirmed) return;

    const successfulDeletion = await deleteProductListing(productId);
    if (!successfulDeletion) {
        alert('Failed to complete item deletion.');
        return;
    }

    appInventory = appInventory.filter(item => item.id !== productId);
    updateFinancialAnalytics();
    renderInventoryCatalog(appInventory);
}

// Catalog search
if (searchInput) {
    searchInput.addEventListener('input', (event) => {
        const normalizedQuery = event.target.value.toLowerCase().trim();
        const filteredResults = appInventory.filter(item =>
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.sku.toLowerCase().includes(normalizedQuery)
        );

        renderInventoryCatalog(filteredResults);
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
