import { NextRequest, NextResponse } from "next/server"
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    
    const response = await axios.post(
      'https://staging-api.streamflow.finance/v2/api/airdrops/search',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error searching airdrops:', error)
    return NextResponse.json(
      { error: 'Failed to search airdrops' },
      { status: 500 }
    )
  }
}   