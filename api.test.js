import { fetchProducts, createProduct, updateProductStock, deleteProductListing, fetchExchangeRates } from './api.js';

global.fetch = jest.fn();

describe('VendaFlow Core API Operations Test Suite', () => {
    const BASE_URL = 'http://localhost:3000/products';

    beforeEach(() => {
        fetch.mockClear();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test('fetchProducts returns a valid array upon successful resolution', async () => {
        const mockPayload = [{ id: '1', title: 'Vintage Jacket', retailPrice: 1200, stockQuantity: 5 }];
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve(mockPayload) })
        );
        const res = await fetchProducts();
        expect(res).toEqual(mockPayload);
    });

    test('fetchProducts returns an empty array fallback on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('Network Down')));
        const res = await fetchProducts();
        expect(res).toEqual([]);
    });

    test('createProduct posts new item data successfully', async () => {
        const newItem = { title: 'New Shirt' };
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '2', ...newItem }) })
        );
        const res = await createProduct(newItem);
        expect(res.id).toBe('2');
    });

    test('createProduct throws an error on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('POST Failed')));
        await expect(createProduct({})).rejects.toThrow();
    });

    test('updateProductStock mutates product values successfully', async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '1', stockQuantity: 4 }) })
        );
        const res = await updateProductStock('1', { stockQuantity: 4 });
        expect(res.stockQuantity).toBe(4);
    });

    test('updateProductStock throws an error on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('PATCH Failed')));
        await expect(updateProductStock('1', {})).rejects.toThrow();
    });

    test('deleteProductListing removes data row successfully', async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ ok: true }));
        const res = await deleteProductListing('1');
        expect(res).toBe(true);
    });

    test('deleteProductListing returns false on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('DELETE Failed')));
        const res = await deleteProductListing('1');
        expect(res).toBe(false);
    });

    test('fetchExchangeRates returns rates object on success', async () => {
        const mockRates = { KES: 130.00 };
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: mockRates }) })
        );
        const res = await fetchExchangeRates();
        expect(res).toEqual(mockRates);
    });

    test('fetchExchangeRates returns null on failure', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('Currency API Down')));
        const res = await fetchExchangeRates();
        expect(res).toBeNull();
    });
});
