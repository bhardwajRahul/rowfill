import jsonata from "jsonata"

export async function mapData(inputData: string, outputSchema: string) {
    const mapper = await jsonata(outputSchema).evaluate(inputData)
    return mapper
}
