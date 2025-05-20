import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    const response = await fetch('https://staging-api.streamflow.finance/v2/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie && { 'Cookie': `session=${sessionCookie.value}` }),
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to fetch session' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
