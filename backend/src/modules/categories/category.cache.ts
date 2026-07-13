import { redisConfig } from "../../config/redis.config";
import {
    getNamespaceVersion,
    remember,
} from "../../utils/cache/cache";
import {
    cacheKeys,
    CACHE_NAMESPACES
} from "../../utils/cache/cache-keys";
import { categoryRepository } from "./category.repository.js";
import { categorySerializer } from "./category.serializer.js";

export async function getCachedActiveCategories() {
    const version = await getNamespaceVersion(
        CACHE_NAMESPACES.CATEGORIES
    );

    const key = cacheKeys.categoryList(version);
    return remember(
        key,
        redisConfig.cacheTtl.categories,
        async() => categorySerializer.list(
            await categoryRepository.findMany(false),
        ),
    );
}
