import { NextRequest, NextResponse } from 'next/server';

type ExcelSheet = (string | number | boolean | null)[][];
let latestExcelData: Record<string, ExcelSheet> | null = null;

export async function POST(req: NextRequest) {
  const { message }: { message: string } = await req.json();

  const sheetPreview = latestExcelData
    ? Object.entries(latestExcelData)
        .map(([name, data]) => `▼ シート: ${name}\n${JSON.stringify(data).slice(0, 1000)}`)
        .join('\n\n')
    : null;

  const prompt = sheetPreview
    ? `以下のExcelデータを参考に、ユーザーの質問に答えてください。\n\n${sheetPreview}\n\n質問：${message}`
    : `あなたはExcel関数とマクロの専門家です。次の質問に正確に答えてください：\n\n${message}`;

  try {
    const res = await fetch(process.env.DIFY_API_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        user: 'guest',
        inputs: {},
      }),
    });

    const data = await res.json();
    const answer = data?.answer || '❌ AIからの回答が得られませんでした';
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ answer: '❌ サーバーエラーが発生しました' });
  }
}

export async function PUT(req: NextRequest) {
  const { sheets }: { sheets: Record<string, ExcelSheet> } = await req.json();
  latestExcelData = sheets;
  return NextResponse.json({ status: 'ok' });
}