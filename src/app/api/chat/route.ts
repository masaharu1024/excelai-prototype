import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();
  console.log("✅ 受け取ったメッセージ:", message);

  const res = await fetch(process.env.DIFY_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      user: 'guest' // ✅ ここを追加！！
    }),
  });

  const data = await res.json();
  console.log("🤖 Difyの返答:", data);

  const answer = data?.answer || 'AIからの回答が得られませんでした';
  return NextResponse.json({ answer });
}