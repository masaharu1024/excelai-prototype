import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionMessageParam, OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// グローバルに保持（注意：サーバレス環境ではセッション維持されない場合あり）
let sheetsData: Record<string, unknown[][]> = {};

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
            `▼ シート名: ${sheetName}\n${(rows as any[][])
              .map((row) => row.join('\t'))
              .join('\n')}`
        )
        .join('\n\n')}`
    : '';

  const systemPrompt = `${baseSystemPrompt}\n${modePrompt}\n\n${sheetPrompt}`;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input },
  ];

  try {
    const chat = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2048, // ✅ 追加：応答の最大長を制限
    });

    const choice = chat.choices[0];

    // ✅ ログ追加：出力内容と完了理由を表示
    console.log('=== OPENAI RAW RESPONSE ===');
    console.log('Text:', choice.message.content);
    console.log('Finish reason:', choice.finish_reason);

    return NextResponse.json({ text: choice.message.content+'*' });
  } catch (e: any) {
    console.error('OpenAI error:', e?.response?.data || e);
    return NextResponse.json({ text: 'エラーが発生しました。', error: true });
  }
}