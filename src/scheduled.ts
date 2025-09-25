import cron from "node-cron"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { queue } from "@/lib/queue"

cron.schedule("*/5 * * * *", async () => {
    try {
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
    } catch (err) {
        logger.error(err)
    }
})
