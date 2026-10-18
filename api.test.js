import { fetchProducts, createProduct, updateProductStock, deleteProductListing } from './api.js';

global.fetch = jest.fn();

describe('VendaFlow Core API Operations Test Suite', () => {
    const BASE_URL = 'http://localhost:3000/products';

    beforeEach(() => {
        fetch.mockClear();
    });

    test('fetchProducts returns a valid array upon successful resolution', async () => {
        const mockPayload = [{ id: '1', title: 'Vintage Jacket', sku: 'FASH-VINT-999', stockQuantity: 5 }];
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve(mockPayload) })
        );
        const res = await fetchProducts();
        expect(res).toEqual(mockPayload);
        expect(fetch).toHaveBeenCalledWith(BASE_URL);
    });

    test('fetchProducts returns an empty array fallback on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ ok: false }));
        const res = await fetchProducts();
        expect(res).toEqual([]);
    });

    test('createProduct posts new item data successfully', async () => {
        const newItem = { title: 'New Shirt', stockQuantity: 10 };
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '2', ...newItem }) })
        );
        const res = await createProduct(newItem);
        expect(res.id).toBe('2');
        expect(fetch).toHaveBeenCalledWith(BASE_URL, expect.objectContaining({ method: 'POST' }));
    });

    test('updateProductStock mutates product values successfully', async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '1', stockQuantity: 4 }) })
        );
        const res = await updateProductStock('1', { stockQuantity: 4 });
        expect(res.stockQuantity).toBe(4);
        expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/1`, expect.objectContaining({ method: 'PATCH' }));
    });

    test('deleteProductListing removes data row successfully', async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ ok: true }));
        const res = await deleteProductListing('1');
        expect(res).toBe(true);
        expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/1`, expect.objectContaining({ method: 'DELETE' }));
    });
});
