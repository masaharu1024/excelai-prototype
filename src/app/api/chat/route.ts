import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json()

    // Gemini API 呼び出し
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: messages[messages.length - 1].content
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API Error:', errorData)

      return NextResponse.json({
        text: '⚠ Gemini APIが現在使えません（Quota超過またはエラー）',
        error: true
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '⚠ 返答が取得できませんでした'

    return NextResponse.json({ text })

  } catch (err) {
    console.error('API呼び出し時のエラー:', err)
    return NextResponse.json({
      text: '⚠ サーバーエラーが発生しました（Quotaまたは通信障害）',
      error: true
    })
  }
}