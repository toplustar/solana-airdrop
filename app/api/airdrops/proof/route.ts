import { NextRequest, NextResponse } from "next/server"
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const distributorAddress = searchParams.get('distributorAddress')
    const claimAddress = searchParams.get('claimAddress')

    if (!distributorAddress || !claimAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const response = await axios.get(
      `https://staging-api.streamflow.finance/v2/api/airdrops/${distributorAddress}/proof/${claimAddress}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching proof:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proof' },
      { status: 500 }
    )
  }
} 