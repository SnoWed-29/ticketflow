import { redisConfig } from "../../config/redis.config";
import { redisClient } from "../../db/redis";
import {
    cacheKeys,
    type CacheNamespace
} from "./cache-keys";

export async function getNamespaceVersion (
    namespace: CacheNamespace
): Promise<number> {
    
    if(!redisConfig.cacheEnabled || !redisClient.isReady) {
        return 1;
    }

    try {
        const key = cacheKeys.version(namespace);
        const existingVersion = await redisClient.get(key);

        if(existingVersion) {
            const parsedVersion = Number(existingVersion);
            return Number.isSafeInteger(parsedVersion) && parsedVersion > 0
                ? parsedVersion
                : 1;
        }
        
        await redisClient.set(key, "1" , {
            NX: true,
        });
        return 1;
    } catch (error) {
        console.error(`failed to read cache namespace version "${namespace}"`, error);

        return 1;
    }
}

export async function bumpCacheNamespaceVersion ( 
    namespace: CacheNamespace,
): Promise<void> {
     if(!redisConfig.cacheEnabled || !redisClient.isReady) {
        return ;
    }

    try {
        const key = cacheKeys.version(namespace);
        await redisClient
            .multi()
            .set(key, "1", { NX: true })
            .incr(key)
            .exec();
 
    } catch (error) {
        console.error(`Failed to invalidate cache namespace "${namespace}"`, error);
    }
}

export async function getCachedValue<T>(
    key: string,
): Promise<T | null> {
    if (!redisConfig.cacheEnabled || !redisClient.isReady){
        return null;
    }

    try {
        const value = await redisClient.get(key);
        if(!value) {
            return null;
        }

        return JSON.parse(value) as T;
    } catch (error) {
        console.error(`Failed to read cache key "${key}"`, error)
        return null;
    }
}

export async function setCachedValue<T> (
    key: string,
    value: T,
    ttlSeconds: number,
): Promise<void> {
    if (!redisConfig.cacheEnabled || !redisClient.isReady) {
        return;
    }

    if(!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
        throw new Error(`Invalid cache TTL supplied for key "${key}".`);
    }

    try {
        await redisClient.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    } catch (error) {
        console.error(`Failed to write cache key "${key}"`, error);
    }
}

export async function remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>
): Promise<T> {
    const cachedValue = await getCachedValue<T>(key)

    if ( cachedValue !== null ) {
        return cachedValue;
    }

    const freshValue = await loader();

    await setCachedValue(key, freshValue, ttlSeconds);
    return freshValue;
}
