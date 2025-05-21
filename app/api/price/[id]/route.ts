import { NextRequest } from "next/server"
import { NextResponse } from "next/server"


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const response = await fetch(
        `https://token-api.streamflow.finance/price?ids=${id}&cluster=devnet`
      )
    const data = await response.json()
    return NextResponse.json(data.data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to get price" }, { status: 500 })
  }
}