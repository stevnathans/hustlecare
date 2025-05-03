import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const { businessIdea, location } = await req.json();

  if (!businessIdea || !location) {
    return NextResponse.json({ error: 'Missing business idea or location' }, { status: 400 });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', 
        messages: [
          {
            role: 'system',
            content: `You are an expert business consultant. When given a business idea and a location, your task is to list all startup requirements categorized into:
          
- Legal Requirements
- Equipment
- Branding
- Operations
- Miscellaneous

Customize the 'Legal Requirements' specifically based on the given location. Respond clearly and organized, using bullet points inside each category.`,
          },
          {
            role: 'user',
            content: `Business idea: ${businessIdea}\nLocation: ${location}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({ result: response.data.choices[0].message.content });
  } catch (error: any) {
    console.error('Error calling OpenAI:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to generate requirements' }, { status: 500 });
  }
}
