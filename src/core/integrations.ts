import { prisma } from "@/lib/prisma"
import { readYamlFile } from "./yaml"
import axios from "axios"
import { mapData } from "./mapper"
import { validate } from "jsonschema"

async function getAccessToken(toolName: string, organizationId: string) {
    const tool = await prisma.integration.findFirst({
        where: { name: toolName, organizationId: organizationId }
    })

    if (!tool) {
        throw new Error("Tool not found")
    }

    const toolsFile = readYamlFile("tools.yml")
    const toolData = toolsFile.tools.find((tool: any) => tool.name === toolName)


    if (tool.refreshToken && tool.accessTokenExpiresAt && tool.accessTokenExpiresAt < new Date()) {

        const data = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: tool.refreshToken,
            client_id: eval(toolData.auth_info.client_id),
            client_secret: eval(toolData.auth_info.client_secret)
        })

        const response = await axios({
            method: "POST",
            url: eval(toolData.auth_info.token_url),
            data: data.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })

        tool.accessToken = response.data.access_token
        tool.accessTokenExpiresAt = new Date(new Date().getTime() + response.data.expires_in * 1000)

        await prisma.integration.update({
            where: {
                name_organizationId: {
                    name: toolName,
                    organizationId: organizationId
                }
            },
            data: tool
        })
    }

    return tool.accessToken

}


export async function getAvailableTools(organizationId: string) {
    const toolsFile = readYamlFile("tools.yml")
    const toolsList = toolsFile.tools.map((tool: any) => ({ name: tool.name, auth: tool.auth, configured: false }))

    // For each tool, check if the ownerId has the tool from prisma
    for (const index in toolsList) {
        const existingTool = await prisma.integration.findFirst({
            where: {
                name: toolsList[index].name,
                organizationId: organizationId
            }
        })

        if (existingTool) {
            toolsList[index].configured = true
        }
    }

    return toolsList
}
