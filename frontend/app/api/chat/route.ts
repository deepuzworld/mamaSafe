import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Ensure API key is set
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                reply: "[System] I am NurtureAI. I hear you, and your feelings are entirely valid. Please note: Gemini API key is missing. Add GEMINI_API_KEY=your_key to frontend/.env.local to activate my full conversational abilities."
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const conversationLog = messages.map((m: any) => `${m.role === 'user' ? 'Mother' : 'NurtureAI'}: ${m.text}`).join('\n');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are NurtureAI, a gentle, highly empathetic, and supportive maternal mental health assistant helping mothers passing through their postpartum journey. 

Below is the ongoing conversation with a mother. 
${conversationLog}

Write your next reply as NurtureAI. 
CRITICAL RULES:
- Respond in a brief, loving, and supportive way.
- Do not be overly clinical or robotic.
- DO NOT use any markdown formatting whatsoever (no bolding, no asterisks, no headers).
- Just output plain, human-like text.`
        });

        return NextResponse.json({ reply: response.text?.trim() });
    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json({ reply: "I'm having a little trouble connecting to my AI brain right now, but I am still here holding space for you. (Check terminal for errors)" });
    }
}
