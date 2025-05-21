import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch("https://staging-api.streamflow.finance/v2/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const setCookie = response.headers.get("set-cookie");
    const sid = setCookie?.match(/sid=([^;]+)/)?.[1] || null;

    if (response.status === 204) {
      return new Response(JSON.stringify({ sid }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const resBody = await response.text();

    // Optionally return sid + full response
    return new Response(JSON.stringify({ ...JSON.parse(resBody), sid }), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
