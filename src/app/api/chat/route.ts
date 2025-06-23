import { NextRequest, NextResponse } from 'next/server';

let latestExcelData: Record<string, any[][]> | null = null;

export async function POST(req: NextRequest) {
  const { message, mode } = await req.json();
  console.log("✅ 受け取ったメッセージ:", message);
  console.log("🔁 モード:", mode);

  let contextText = '';
  if (latestExcelData) {
    contextText = Object.entries(latestExcelData)
      .map(([sheetName, data]) => {
        const preview = JSON.stringify(data).slice(0, 1000); // 長すぎるとAPI制限にかかる
        return `▼ シート名: ${sheetName}\n${preview}`;
      })
      .join('\n\n');
  }

  const prompt = contextText
    ? `以下のExcelデータを参考にして、ユーザーの質問に答えてください：\n\n${contextText}\n\n質問：${message}`
    : `あなたはExcel関数とマクロの専門家です。以下の質問にExcel関数またはマクロで回答してください：\n\n${message}`;

  try {
    const res = await fetch(process.env.DIFY_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        user: 'guest',
        inputs: {},
      }),
    });

    const data = await res.json();
    console.log("🤖 Difyの返答:", JSON.stringify(data, null, 2));

    // 修正ポイント：answerがなければエラーメッセージを表示
    const answer = data?.answer || `⚠️ エラー発生: ${data?.message || '詳細不明'}`;
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("❌ fetch例外:", err);
    return NextResponse.json({ answer: '❌ AIからの応答取得中にエラーが発生しました' });
  }
}

export async function PUT(req: NextRequest) {
  const { sheets } = await req.json();
  latestExcelData = sheets;
  console.log("✅ Excelデータを更新（複数シート対応）:", Object.keys(sheets || {}));
  return NextResponse.json({ status: 'ok' });
}