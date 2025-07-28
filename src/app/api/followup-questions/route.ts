import {NextRequest, NextResponse} from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;
        const questions = await getResponse(prompt)
        return NextResponse.json({
            success: true,
            ...questions
        })
    } catch(err) {
        console.error("Error fetchnig questions", err)
        return NextResponse.json({
            success: false,
            questions: []
        }, {status: 500})
    }
}

async function getResponse(prompt: string): Promise<{ questions: string[] }> {
    try {
        const response = await makeRequestToOpenAi(prompt);
        if (!response.ok) {
            console.error(await response.json())
            return { questions: [] };
        } else {
            const rawResponseFromOai = await response.json();
            const questionsText = rawResponseFromOai.output[0].content[0].text;
            const parsedQuestions = JSON.parse(questionsText);
            return parsedQuestions;
        }
    } catch (error) {
        console.error('Error fetching response:', error);
        return { questions: [] };
    }
}


async function makeRequestToOpenAi(prompt: string) {
    const baseUrl = 'https://api.openai.com/v1/responses';
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
    };
    const body = {
        model: 'gpt-4o',
        input: [
        {
            role: 'developer',
            content:
            'You are an expert at structured data extraction. Given a prompt, your job is to generate exactly 6 follow up questions related to it as a JSON object.'+
            'If there are no scientific terms then just generate questions regarding RMR studies, SENS framework or longevity. Just remember that it should be scientific and relevant to the topic.',
        },
        {
            role: 'user',
            content: prompt,
        },
        ],
        text: {
        format: {
            type: 'json_schema',
            name: 'follow_up_questions',
            schema: {
            type: 'object',
            properties: {
                questions: {
                type: 'array',
                items: { type: 'string' },
                },
            },
            required: ['questions'],
            additionalProperties: false,
            },
            strict: true,
        },
        },
    };
    const response = await fetch(baseUrl, {
        headers,
        body: JSON.stringify(body),
        method: 'POST',
    });
    return response;
}
