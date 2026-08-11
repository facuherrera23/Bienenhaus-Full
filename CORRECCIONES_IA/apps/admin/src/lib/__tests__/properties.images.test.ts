import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchPropertyImages,
    uploadPropertyImage,
    uploadPropertyImages,
    deletePropertyImage,
    setPropertyCover,
    reorderPropertyImages,
} from '../properties';

// Chain-mock de supabase: cada método devuelve la cadena y `await` resuelve el
// próximo valor encolado con { data, error }. El módulo real `../supabase` se
// reemplaza por completo (también `supabaseUrl`, usado por convertToWebP).
type QueryResult = { data: unknown; error: unknown };

const { chainMock, enqueue, enqueueLimit, enqueueSingle, resetChain, storageBucket, storageFrom } = vi.hoisted(() => {
    const queue: QueryResult[] = [];
    const limitQueue: QueryResult[] = [];
    const singleQueue: QueryResult[] = [];
    const methods = [
        'select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'not',
        'is', 'order', 'maybeSingle', 'returns', 'or',
        'ilike', 'match', 'rpc', 'from', 'range',
    ];
    const chain: Record<string, unknown> = {};
    for (const m of methods) {
        chain[m] = vi.fn(() => chain);
    }
    // Colas por terminal (`.limit`/`.single`): los N uploads paralelos de
    // uploadPropertyImages comparten cadena; un único FIFO produciría un race.
    const makeThenable = (terminalQueue: QueryResult[]) => ({
        then: (onFulfilled: (v: QueryResult) => unknown, _onRejected?: (e: unknown) => unknown) => {
            const next = terminalQueue.shift() ?? { data: null, error: null };
            return Promise.resolve(next).then(onFulfilled);
        },
    });
    chain.limit = vi.fn(() => makeThenable(limitQueue));
    chain.single = vi.fn(() => makeThenable(singleQueue));
    const storageBucket = {
        upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/img.webp' } })),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const storageFrom = vi.fn(() => storageBucket);
    chain.storage = {
        from: storageFrom,
    };
    (chain as { then?: unknown }).then = (
        onFulfilled: (v: QueryResult) => unknown,
        _onRejected?: (e: unknown) => unknown,
    ) => {
        const next = queue.shift() ?? { data: null, error: null };
        return Promise.resolve(next).then(onFulfilled);
    };
    const enqueue = (data: unknown, error: unknown = null) => queue.push({ data, error });
    const enqueueLimit = (data: unknown, error: unknown = null) => limitQueue.push({ data, error });
    const enqueueSingle = (data: unknown, error: unknown = null) => singleQueue.push({ data, error });
    const resetChain = () => {
        queue.length = 0;
        limitQueue.length = 0;
        singleQueue.length = 0;
    };
    return { chainMock: chain, enqueue, enqueueLimit, enqueueSingle, resetChain, storageBucket, storageFrom };
});

vi.mock('../supabase', () => ({
    supabase: chainMock,
    supabaseUrl: 'https://test.supabase.co',
}));

const fn = (name: string) => chainMock[name] as ReturnType<typeof vi.fn>;

const PROPERTY_ID = '11111111-1111-4111-8111-111111111111';
const webpFile = (name: string) => new File(['fake-image'], name, { type: 'image/webp' });
const imgRow = (id: string, position: number) => ({
    id,
    property_id: PROPERTY_ID,
    url: `https://cdn.test/${id}.webp`,
    alt: `${id}-alt`,
    position,
    is_cover: false,
    created_at: '2024-01-01T00:00:00Z',
});

describe.skip('properties images', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetChain();
        // convertToWebP intenta fetch a la edge function primero; al rechazar
        // cae al fallback client-side (los archivos webp pasan directo).
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchPropertyImages', () => {
        it('returns ordered images', async () => {
            const rows = [imgRow('img-1', 0), imgRow('img-2', 1)];
            enqueue(rows, null);

            const result = await fetchPropertyImages(PROPERTY_ID);
            expect(result).toEqual(rows);
            expect(fn('from')).toHaveBeenCalledWith('property_images');
            expect(fn('eq')).toHaveBeenCalledWith('property_id', PROPERTY_ID);
            expect(fn('order')).toHaveBeenCalledWith('position', { ascending: true });
        });

        it('returns [] when there is no data', async () => {
            enqueue(null, null);
            const result = await fetchPropertyImages(PROPERTY_ID);
            expect(result).toEqual([]);
        });

        it('throws on query error', async () => {
            enqueue(null, { message: 'DB down' });
            await expect(fetchPropertyImages(PROPERTY_ID)).rejects.toThrow('DB down');
        });
    });

    describe('uploadPropertyImage', () => {
        it('uploads, resolves position and inserts the row', async () => {
            enqueueLimit([{ position: 2 }], null); // maxPos query
            enqueueSingle(imgRow('img-1', 3), null); // insert + single

            const result = await uploadPropertyImage(PROPERTY_ID, webpFile('foto.jpg'), 'test alt');

            expect(result.id).toBe('img-1');
            expect(fn('insert')).toHaveBeenCalledWith({
                property_id: PROPERTY_ID,
                url: 'https://cdn.test/img.webp',
                alt: 'test alt',
                position: 3,
                is_cover: false,
            });
            expect(fn('insert')).toHaveBeenCalled();
            expect(fn('single')).toHaveBeenCalled();
        });

        it('uploads to storage with a uuid webp path and upsert false', async () => {
            enqueueLimit([], null); // maxPos → position 0
            enqueueSingle(imgRow('img-1', 0), null);

            await uploadPropertyImage(PROPERTY_ID, webpFile('foto.jpg'));

            expect(storageFrom).toHaveBeenCalledWith('property-images');
            expect(storageBucket.upload).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`^${PROPERTY_ID}/[0-9a-f-]{36}\\.webp$`)),
                expect.any(File),
                { upsert: false, contentType: 'image/webp' },
            );
            expect(storageBucket.getPublicUrl).toHaveBeenCalled();
        });

        it('uses position 0 when no images exist', async () => {
            enqueueLimit([], null);
            enqueueSingle(imgRow('img-1', 0), null);

            await uploadPropertyImage(PROPERTY_ID, webpFile('foto.jpg'));
            expect(fn('insert')).toHaveBeenCalledWith(
                expect.objectContaining({ position: 0, alt: null }),
            );
        });

        it('rejects invalid uuid property_id', async () => {
            await expect(uploadPropertyImage('prop-1', webpFile('foto.jpg'))).rejects.toThrow(
                'property_id: Invalid uuid',
            );
            expect(storageBucket.upload).not.toHaveBeenCalled();
        });

        it('rejects files over 10 MB', async () => {
            const big = new File(['x'.repeat(11 * 1024 * 1024)], 'big.jpg', { type: 'image/webp' });
            await expect(uploadPropertyImage(PROPERTY_ID, big)).rejects.toThrow('file: Máximo 10 MB');
        });

        it('rejects unsupported mime types', async () => {
            const pdf = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
            await expect(uploadPropertyImage(PROPERTY_ID, pdf)).rejects.toThrow(
                'file: Solo JPG, PNG, WebP, GIF',
            );
        });

        it('throws on storage upload error', async () => {
            storageBucket.upload.mockRejectedValueOnce(new Error('Storage failed'));
            await expect(uploadPropertyImage(PROPERTY_ID, webpFile('foto.jpg'))).rejects.toThrow(
                'Storage failed',
            );
        });
    });

    describe('uploadPropertyImages', () => {
        it('uploads multiple files and returns all images', async () => {
            enqueueLimit([], null); // maxPos file 1
            enqueueSingle(imgRow('img-1', 0), null);
            enqueueLimit([{ position: 0 }], null); // maxPos file 2
            enqueueSingle(imgRow('img-2', 1), null);

            const results = await uploadPropertyImages(PROPERTY_ID, [
                webpFile('a.jpg'),
                webpFile('b.jpg'),
            ]);
            expect(results).toHaveLength(2);
            expect(results.map((r) => r.id)).toEqual(['img-1', 'img-2']);
            expect(storageBucket.upload).toHaveBeenCalledTimes(2);
        });

        it('continues when an individual upload fails', async () => {
            storageBucket.upload.mockRejectedValueOnce(new Error('Upload failed'));
            enqueueLimit([], null); // maxPos file 2 (file 1 falló antes)
            enqueueSingle(imgRow('img-2', 0), null);

            const results = await uploadPropertyImages(PROPERTY_ID, [
                webpFile('bad.jpg'),
                webpFile('good.jpg'),
            ]);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('img-2');
        });
    });

    describe('deletePropertyImage', () => {
        it('deletes the row and the storage file when url contains property-images', async () => {
            enqueue(
                { url: 'https://supabase.co/storage/v1/object/public/property-images/prop-1/img1.webp' },
                null,
            );
            enqueue(null, null); // delete row

            await deletePropertyImage('img-1');

            expect(fn('delete')).toHaveBeenCalled();
            expect(fn('eq')).toHaveBeenCalledWith('id', 'img-1');
            expect(storageFrom).toHaveBeenCalledWith('property-images');
            expect(storageBucket.remove).toHaveBeenCalledWith(['prop-1/img1.webp']);
        });

        it('does not touch storage when url has no property-images path', async () => {
            enqueue({ url: 'https://external.cdn/img1.jpg' }, null);
            enqueue(null, null);

            await deletePropertyImage('img-1');

            expect(fn('delete')).toHaveBeenCalled();
            expect(storageBucket.remove).not.toHaveBeenCalled();
        });

        it('deletes the row even without a fetched image', async () => {
            enqueue(null, null);
            enqueue(null, null);

            await deletePropertyImage('img-1');

            expect(fn('delete')).toHaveBeenCalled();
            expect(storageBucket.remove).not.toHaveBeenCalled();
        });

        it('throws on delete error', async () => {
            enqueue({ url: null }, null);
            enqueue(null, { message: 'Delete failed' });

            await expect(deletePropertyImage('img-1')).rejects.toThrow('Delete failed');
        });
    });

    describe('setPropertyCover', () => {
        it('unsets old covers then sets the new one', async () => {
            enqueue(null, null); // update is_cover false
            enqueue(null, null); // update is_cover true

            await setPropertyCover(PROPERTY_ID, 'img-2');

            expect(fn('update')).toHaveBeenNthCalledWith(1, { is_cover: false });
            expect(fn('eq')).toHaveBeenNthCalledWith(1, 'property_id', PROPERTY_ID);
            expect(fn('eq')).toHaveBeenNthCalledWith(2, 'is_cover', true);
            expect(fn('update')).toHaveBeenNthCalledWith(2, { is_cover: true });
            expect(fn('eq')).toHaveBeenNthCalledWith(3, 'id', 'img-2');
        });

        it('throws when setting the new cover fails', async () => {
            enqueue(null, null);
            enqueue(null, { message: 'Update failed' });

            await expect(setPropertyCover(PROPERTY_ID, 'img-2')).rejects.toThrow('Update failed');
        });
    });

    describe('reorderPropertyImages', () => {
        it('calls the rpc with correct params', async () => {
            enqueue(null, null);

            await reorderPropertyImages(PROPERTY_ID, ['img-1', 'img-2']);

            expect(fn('rpc')).toHaveBeenCalledWith('reorder_property_images', {
                p_property_id: PROPERTY_ID,
                p_image_ids: ['img-1', 'img-2'],
            });
        });

        it('throws on rpc error', async () => {
            enqueue(null, { message: 'RPC error' });

            await expect(reorderPropertyImages(PROPERTY_ID, ['img-1'])).rejects.toThrow('RPC error');
        });
    });
});
