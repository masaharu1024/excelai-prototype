import { NextRequest, NextResponse } from 'next/server';

let latestExcelData: any[][] | null = null;

// グローバル変数に保存されたExcelデータを設定する関数
export function setExcelData(data: any[][]) {
  latestExcelData = data;
}

// APIハンドラ
export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  console.log("✅ 受け取ったメッセージ:", message);
  console.log("📄 Excelデータ:", latestExcelData ? 'あり' : 'なし');

  // 表データ（最大3000文字）を切り出し
  const sheetData = latestExcelData ? JSON.stringify(latestExcelData).slice(0, 3000) : null;

  // プロンプトを文脈付きに構築
  const prompt = sheetData
    ? `以下のExcelデータを参考にして、ユーザーの質問に答えてください：\n\n${sheetData}\n\n質問：${message}`
    : message;

  const difyRes = await fetch(process.env.DIFY_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: prompt,
      user: 'guest', // 固定ユーザー名（匿名）
      inputs: {
        uploaded_data: sheetData || '', // チャットフローでinputs.uploaded_dataを参照可能
      },
    }),
  });

  const data = await difyRes.json();
  console.log("🤖 Difyの返答:", data);

  const answer = data?.answer || 'AIからの回答が得られませんでした';

  return NextResponse.json({ answer });
}