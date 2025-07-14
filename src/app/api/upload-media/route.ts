import { NextRequest, NextResponse } from 'next/server';

const ELIZA_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Get the agent ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Agent ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();
    
    // Get the user's ID (UUID) from query parameters (passed by the client)
    const userId = searchParams.get('userId');
    
    // Add required fields for knowledge upload API
    formData.append('agentId', agentId);
    if (userId) {
      formData.append('chunksDbName', userId);
    }

    // Create the ElizaOS knowledge upload API URL
    const elizaUrl = `${ELIZA_SERVER_URL}/api/documents`;

    console.log(`[Knowledge Upload Proxy] POST ${elizaUrl}`);

    // Forward the form data to the ElizaOS server
    const response = await fetch(elizaUrl, {
      method: 'POST',
      body: formData, // FormData is automatically handled with correct Content-Type
    });

    // Parse the response
    const data = await response.json();

    console.log('[Knowledge Upload Proxy] Response:', data);

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
      },
    });
  } catch (error) {
    console.error('[Knowledge Upload Proxy] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload documents to ElizaOS server',
        },
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
    },
  });
}
