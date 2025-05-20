import { NextRequest, NextResponse } from "next/server"
import axios from 'axios'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await axios.get(
      `https://staging-api.streamflow.finance/v2/api/airdrops/claimable/${params.id}/`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching claimable airdrops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claimable airdrops' },
      { status: 500 }
    )
  }
}