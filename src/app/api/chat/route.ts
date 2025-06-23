import { NextRequest, NextResponse } from 'next/server';

let latestExcelData: any[][] | null = null;

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  console.log("✅ 受け取ったメッセージ:", message);

  const sheetData = latestExcelData ? JSON.stringify(latestExcelData).slice(0, 3000) : null;
  console.log("📄 Excelデータ:", sheetData ? sheetData.slice(0, 100) + '...' : 'なし');

  const prompt = sheetData
    ? `以下のExcelデータを参考にして、ユーザーの質問に答えてください：\n\n${sheetData}\n\n質問：${message}`
    : `あなたはExcel関数とマクロの専門家です。以下の質問にExcel関数またはマクロで回答してください：\n\n${message}`;

  try {
    const res = await fetch(process.env.DIFY_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: prompt,
        user: 'guest',
        inputs: {}
      })
    });

    const data = await res.json();
    console.log("🤖 Difyの返答:", data);

    const answer = data?.answer || 'AIからの回答が得られませんでした';
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("❌ エラー:", err);
    return NextResponse.json({ answer: 'AIからの回答が得られませんでした' });
  }
}

export async function PUT(req: NextRequest) {
  const { data } = await req.json();
  latestExcelData = data;
  console.log("✅ Excelデータを更新:", data?.slice(0, 2));
  return NextResponse.json({ status: 'ok' });
}