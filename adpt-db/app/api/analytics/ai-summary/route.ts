import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chartData, instructions, databaseName, fields } = await req.json();

    // Prepare prompt for LLM
    const prompt = `You are a data analyst. Analyze the following data and provide a clear, professional executive summary.

Database: ${databaseName}
Fields Analyzed: ${fields.join(', ')}
User Instructions: ${instructions || 'Provide general analysis'}

Chart Data:
${JSON.stringify(chartData, null, 2)}

Provide:
1. Key insights (2-3 main findings)
2. Notable patterns or trends
3. Recommendations (if applicable)
4. Data quality observations

Keep the summary concise and professional (2-3 paragraphs).`;

    // Call LLM API (using OpenAI as example, update with your provider)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert data analyst. Provide clear, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LLM API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Unable to generate summary';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Fallback response if LLM fails
    return NextResponse.json({
      summary: 'Unable to generate AI summary. Please ensure your LLM API is configured correctly.',
    });
  }
}
