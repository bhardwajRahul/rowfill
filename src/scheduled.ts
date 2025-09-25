import cron from "node-cron"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { queue } from "@/lib/queue"

cron.schedule("*/5 * * * *", async () => {
    try {
        const lock = await redis.get("cron-lock")

        logger.info("CRON Lock Status", lock)

        if (lock) {
            return
        }

        // Auto Expire in 2 hours
        await redis.set("cron-lock", "true", "EX", 60 * 60 * 2)

        logger.info("Starting CRON")

        if (process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
            await prisma.billing.updateMany({
                where: {
                    AND: [
                        {
                            expiresAt: {
                                not: null
                            }
                        },
                        {
                            expiresAt: {
                                lte: new Date()
                            }
                        }
                    ]
                },
                data: {
                    plan: "FREE",
                    expiresAt: null
                }
            })
        }

        const sources = await prisma.source.findMany({
            where: {
                isIndexed: false,
                isIndexing: false,
                indexRunCount: {
                    lte: 3 // Max Retries
                }
            }
        })

        for (const source of sources) {
            await prisma.source.update({
                where: {
                    id: source.id
                },
                data: {
                    isIndexing: true
                }
            })

            await queue.add("indexSource", { sourceId: source.id })
        }

        await redis.del("cron-lock")

    } catch (err) {
        logger.error(err)
        await redis.del("cron-lock")
    }
})
