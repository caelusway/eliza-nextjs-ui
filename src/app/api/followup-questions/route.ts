import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser, getSecurityHeaders } from '@/lib/auth-middleware';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function followupQuestionsHandler(req: NextRequest, user: AuthenticatedUser) {
  try {
    console.log('[Followup Questions] Handler called with user:', user.userId);
    
    if (!OPENAI_API_KEY) {
      console.error('[Followup Questions] OpenAI API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured',
          questions: [],
        },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    const body = await req.json();
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string') {
      console.error('[Followup Questions] Invalid or missing prompt');
      return NextResponse.json(
        {
          success: false,
          error: 'Valid prompt is required',
          questions: [],
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }
    
    console.log('[Followup Questions] Processing prompt for user:', user.userId);
    const questions = await getResponse(prompt);
    
    return NextResponse.json(
      {
        success: true,
        ...questions,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (err) {
    console.error('[Followup Questions] Error fetching questions:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate follow-up questions',
        questions: [],
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

async function getResponse(prompt: string): Promise<{ questions: string[] }> {
  try {
    console.log('[Followup Questions] Making OpenAI API request...');
    const response = await makeRequestToOpenAi(prompt);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Followup Questions] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return { questions: [] };
    } else {
      const rawResponseFromOai = await response.json();
      console.log('[Followup Questions] OpenAI API response structure:', {
        hasChoices: !!rawResponseFromOai.choices,
        choicesLength: rawResponseFromOai.choices?.length,
        hasMessage: !!rawResponseFromOai.choices?.[0]?.message,
        messageKeys: rawResponseFromOai.choices?.[0]?.message ? Object.keys(rawResponseFromOai.choices[0].message) : 'none'
      });
      
      const questionsText = rawResponseFromOai.choices[0].message.content;
      const parsedQuestions = JSON.parse(questionsText);
      console.log('[Followup Questions] Generated questions:', parsedQuestions);
      return parsedQuestions;
    }
  } catch (error) {
    console.error('[Followup Questions] Error fetching response:', error);
    return { questions: [] };
  }
}

async function makeRequestToOpenAi(prompt: string) {
  const baseUrl = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  
  const body = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert at structured data extraction. Given a prompt, your job is to generate exactly 6 follow up questions related to it as a JSON object.' +
          'If there are no scientific terms then just generate questions regarding RMR studies, SENS framework or longevity. Just remember that it should be scientific and relevant to the topic.' +
          'Always respond with valid JSON in this format: {"questions": ["question1", "question2", "question3", "question4", "question5", "question6"]}',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: {
      type: 'json_object'
    },
    temperature: 0.7,
    max_tokens: 1000,
  };
  
  console.log('[Followup Questions] Making request to:', baseUrl);
  const response = await fetch(baseUrl, {
    headers,
    body: JSON.stringify(body),
    method: 'POST',
  });
  return response;
}

export const POST = withAuth(followupQuestionsHandler);
