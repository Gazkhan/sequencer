// @ts-check


// cache version history:
// 1: initial
// 2: zstandard compressed ktx2 files and response metadata
// 3: Remove cache size limit and increase scaled spritesheet resolutions
const cacheVersion = 3;
const cacheName = `SequencerKTX2Cache-${cacheVersion}`;
/** @type {Promise<Cache | null>} */
let ktx2FileCache;
try {
	ktx2FileCache = caches.open(cacheName);
} catch {
	ktx2FileCache = Promise.resolve(null);
}

// delete old caches if ever needed...
async function deleteOldCaches(currentCache) {
	const keys = await caches.keys();

	for (const key of keys) {
		const isOurCache = key.startsWith("SequencerKTX2Cache-");
		if (currentCache === key || !isOurCache) {
			continue;
		}
		caches.delete(key);
	}
}
deleteOldCaches(cacheName);

export class Ktx2FileCache {
	/**
	 *
	 * @param {string} id
	 * @param {string} hash
	 * @returns {Request}
	 */
	#getKtxFileCacheRequest(id, hash) {
		return new Request(`${id}?spritesheet`);
	}

	/**
	 * Verifies the response hash and deletes old cache entries in case of a hash mismatch
	 * @param {Response} response
	 * @param {string} hash
	 * @returns {boolean} true if hash matches, false otherwise
	 */
	#verifyResponseHash(response, hash) {
		const responseHash = response.headers.get("x-hash");
		if (responseHash === hash) {
			return true;
		}

		return false;
	}

	/**
	 * @param {string} id
	 * @param {string} hash
	 * @returns {Promise<Uint8Array | undefined>}
	 */
	async getCachedKtxFile(id, hash) {
		const cacheStorage = await ktx2FileCache.catch(() => null);
		if (!cacheStorage) {
			return;
		}
		const request = this.#getKtxFileCacheRequest(id, hash);
		const cacheResponse = await cacheStorage.match(request);
		if (!cacheResponse) {
			return;
		}
		if (!this.#verifyResponseHash(cacheResponse, hash)) {
			return;
		}
		return new Uint8Array(await cacheResponse.arrayBuffer());
	}

	/**
	 * @param {string} id
	 * @param {string} sourceHash
	 * @param {Uint8Array} ktx2FileBuffer
	 * @returns {Promise<void>}
	 */
	async saveKtxFileToCache(id, sourceHash, ktx2FileBuffer) {
		const cacheStorage = await ktx2FileCache.catch(() => null);
		if (!cacheStorage) {
			return;
		}
		const request = this.#getKtxFileCacheRequest(id, sourceHash);
		const response = new Response(ktx2FileBuffer.buffer, {
			headers: {
				"x-hash": sourceHash,
				"Content-Type": "image/ktx2",
				"Content-Length": String(ktx2FileBuffer.byteLength),
			},
		});
		await cacheStorage.put(request, response);
	}

	/**
	 *
	 * @param {string} id
	 * @param {string} hash
	 * @returns {Request}
	 */
	#getSpriteDataCacheRequest(id, hash) {
		return new Request(`${id}?sprites`);
	}
	/**
	 * @param {string} id
	 * @param {string} hash
	 * @returns {Promise<CachedSpriteData | undefined>}
	 */
	async getCachedSprites(id, hash) {
		const cacheStorage = await ktx2FileCache.catch(() => null);
		if (!cacheStorage) {
			return;
		}
		const request = this.#getSpriteDataCacheRequest(id, hash);
		const cacheResponse = await cacheStorage.match(request);
		if (!cacheResponse) {
			return;
		}
		if (!this.#verifyResponseHash(cacheResponse, hash)) {
			return;
		}
		return await cacheResponse.json();
	}

	/**
	 * @param {string} id
	 * @param {string} sourceHash
	 * @param {CachedSpriteData} spritesData
	 * @returns {Promise<void>}
	 */
	async saveSpritesToCache(id, sourceHash, spritesData) {
		const cacheStorage = await ktx2FileCache.catch(() => null);
		if (!cacheStorage) {
			return;
		}
		const request = this.#getSpriteDataCacheRequest(id, sourceHash);
		const spriteDataString = JSON.stringify(spritesData);
		const response = new Response(spriteDataString, {
			headers: {
				"x-hash": sourceHash,
				"Content-Type": "application/json",
				"Content-Length": String(spriteDataString.length),
			},
		});
		await cacheStorage.put(request, response);
	}
}

/**
 * @typedef {{sprites: import("./FramePacker.js").SpriteData[], frameRate: number, scale: number}} CachedSpriteData
 */
