import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let sheetsData: Record<string, (string | number | null)[][]> = {};

export async function PUT(req: NextRequest) {
  const body = await req.json();
  sheetsData = body.sheets || {};
  return NextResponse.json({ status: 'ok' });
}

export async function POST(req: NextRequest) {
  const { input, mode, model } = await req.json();

  const baseSystemPrompt = `あなたはExcelのプロです。`;
  const modePrompt =
    mode === 'function'
      ? 'ユーザーの入力に対して、Excel関数のみを簡潔に返してください。'
      : mode === 'vba'
      ? 'ユーザーの入力に対して、Excelマクロ（VBA）コードを返してください。'
      : 'ユーザーの質問に丁寧に答えてください。';

  const sheetPrompt = Object.keys(sheetsData).length
    ? `以下はユーザーがアップロードしたExcelファイルの内容です。\n\n${Object.entries(sheetsData)
        .map(
          ([sheetName, rows]) =>
            `▼ シート名: ${sheetName}\n${rows
              .map((row) => row.join('\t'))
              .join('\n')}`
        )
        .join('\n\n')}`
    : '';

  const systemPrompt = `${baseSystemPrompt}\n${modePrompt}\n\n${sheetPrompt}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input },
  ];

  try {
    const chat = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    });

    const choice = chat.choices[0];

    console.log('=== OPENAI RAW RESPONSE ===');
    console.log('Text:', choice.message.content);
    console.log('Finish reason:', choice.finish_reason);

    return NextResponse.json({ text: choice.message.content + '\u200B' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('OpenAI error:', e.message);
    } else {
      console.error('Unknown OpenAI error:', e);
    }
    return NextResponse.json({ text: 'エラーが発生しました。', error: true });
  }
}