import { fetchProducts, createProduct, updateProductStock, deleteProductListing } from './api.js';

let appInventory = [];

const entryForm = document.getElementById('product-entry-form');
const searchInput = document.getElementById('catalog-search');
const displayGrid = document.getElementById('inventory-grid');

const grossSalesEl = document.getElementById('metric-gross');
const platformFeesEl = document.getElementById('metric-fees');
const netPayoutEl = document.getElementById('metric-net');

async function initializeDashboard() {
    appInventory = await fetchProducts();
    updateFinancialAnalytics();
    renderInventoryCatalog(appInventory);
}

function updateFinancialAnalytics() {
    const PLATFORM_FEE_RATE = 0.10;

    const totalGrossRevenue = appInventory.reduce((accumulator, item) => {
        return accumulator + (item.retailPrice * item.stockQuantity);
    }, 0);

    const accumulatedFees = totalGrossRevenue * PLATFORM_FEE_RATE;
    const computedNetPayout = totalGrossRevenue - accumulatedFees;

    grossSalesEl.textContent = `KSh ${totalGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    platformFeesEl.textContent = `KSh ${accumulatedFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    netPayoutEl.textContent = `KSh ${computedNetPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function renderInventoryCatalog(productsList) {
    displayGrid.innerHTML = '';

    if (productsList.length === 0) {
        displayGrid.innerHTML = '<p class="empty-state">No matching inventory items found.</p>';
        return;
    }

    productsList.forEach(item => {
        const cardNode = document.createElement('div');
        const isOutOfStock = item.stockQuantity <= 0;
        
        cardNode.className = 'product-profile-card';
        cardNode.style.border = '1px solid #cbd5e1';
        cardNode.style.padding = '1rem';
        cardNode.style.borderRadius = '6px';
        cardNode.style.background = isOutOfStock ? '#fee2e2' : '#ffffff';
        cardNode.style.marginBottom = '1rem';

        cardNode.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background: #e2e8f0; border-radius: 4px;">${item.category}</span>
                <span style="font-size: 0.8rem; font-weight: bold; color: ${isOutOfStock ? '#ef4444' : '#10b981'};">
                    ${isOutOfStock ? 'Out of Stock' : `Stock: \${item.stockQuantity}`}
                </span>
            </div>
            <h4 style="margin-bottom: 0.25rem;">${item.title}</h4>
            <p style="font-size: 0.75rem; color: #64748b; font-family: monospace; margin-bottom: 0.75rem;">SKU: ${item.sku}</p>
            <div style="font-size: 0.9rem; margin-bottom: 1rem;">
                <p>Cost: <span style="font-weight: 500;">KSh ${item.wholesaleCost}</span></p>
                <p>Price: <span style="font-weight: 600; color: #2563eb;">KSh ${item.retailPrice}</span></p>
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

entryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const inputTitle = document.getElementById('prod-title').value;
    const inputCategory = document.getElementById('prod-category').value;
    const inputCost = Number(document.getElementById('prod-cost').value);
    const inputRetail = Number(document.getElementById('prod-retail').value);
    const inputStock = Number(document.getElementById('prod-stock').value);

    const generatedSku = `${inputCategory.substring(0, 3).toUpperCase()}-${inputTitle.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newProductPayload = {
        title: inputTitle,
        category: inputCategory,
        wholesaleCost: inputCost,
        retailPrice: inputRetail,
        stockQuantity: inputStock,
        sku: generatedSku
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

searchInput.addEventListener('input', (event) => {
    const searchNormalizedQuery = event.target.value.toLowerCase().trim();
    
    const filteredResults = appInventory.filter(item => {
        return item.title.toLowerCase().includes(searchNormalizedQuery) || 
               item.sku.toLowerCase().includes(searchNormalizedQuery);
    });

    renderInventoryCatalog(filteredResults);
});

document.addEventListener('DOMContentLoaded', initializeDashboard);
