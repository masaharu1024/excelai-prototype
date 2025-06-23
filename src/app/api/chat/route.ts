import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message, excelData } = await req.json();

  console.log("✅ 受け取ったメッセージ:", message);
  console.log("📄 Excelデータ:", excelData?.length ? `${excelData.length} 行` : "なし");

  const prompt = `
以下はアップロードされたExcelの表の内容の一部です（2次元配列）：
${JSON.stringify(excelData).slice(0, 3000)}

この情報を参考にして、以下の質問に答えてください：
${message}
`;

  try {
    const res = await fetch(process.env.DIFY_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        user: 'guest',
      }),
    });

    const data = await res.json();
    console.log("🤖 Difyの返答:", data);

    const answer = data?.answer || 'AIからの回答が得られませんでした';
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('❌ エラー:', error);
    return NextResponse.json({ answer: 'エラーが発生しました。再度お試しください。' });
  }
}