import { createClient } from "redis";
import { redisConfig } from "../config/redis.config";

export const redisClient = createClient({
    url: redisConfig.url,
    socket: {
        reconnectStrategy(retries){
            if (retries > 10 ){
                console.error("Redis reconnection stopped after 10 attempts.");
                return new Error("Redis reconnection attempts exhausted.");
            }
            return Math.min(retries * 100, 3_000)
        },
    },
});

redisClient.on("connect", () =>{ 
    console.info("connecting to Redis...");
});

redisClient.on("ready", () =>{
     console.info("Redis connection is ready.");
});

redisClient.on("reconnecting",()=>{
    console.warn("Reconnecting to Redis...");
});

redisClient.on("error",(error) => {
    console.error("Redis error:", error)
})

redisClient.on("end",() => {
    console.warn("Redis connection is closed.")
})

export async function connectRedis(): Promise<void>{
    if (redisClient.isOpen){
        return;
    }
    
    await redisClient.connect();

    const response = await redisClient.ping();

    if(response !== "PONG") {
        throw new Error("Redis health check failed");
    }

    console.info("Redis connected successfully.");
}

export async function disconnectRedis (): Promise<void> {
    if(!redisClient.isOpen){
        return;
    }

    if (redisClient.isReady) {
        await redisClient.quit();
        return;
    }

    redisClient.destroy();
}

export async function checkRedisConnection(): Promise<boolean> {
    if (!redisClient.isReady) {
        return false;
    }

    try {
        return (await redisClient.ping() === "PONG")
    } catch {
        return false
    }
}
