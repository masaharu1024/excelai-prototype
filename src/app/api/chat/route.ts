import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Excelファイルのシートデータ保持
let sheetsData: Record<string, (string | number | null)[][]> = {};

export async function PUT(req: NextRequest) {
  const body = await req.json();
  sheetsData = body.sheets || {};
  return NextResponse.json({ status: 'ok' });
}

export async function POST(req: NextRequest) {
  const { input, mode } = await req.json();
  const model = 'gpt-4o';

  // モードごとのシステムプロンプト
  let basePrompt = '';

  switch (mode) {
    case 'advisor':
      basePrompt = `
あなたはExcelのエキスパートです。ユーザーはExcel初心者から中級者で、Excel関数、操作方法、グラフ作成、VBA、データ処理など様々な質問をしてきます。ユーザーの質問の意図を汲み取り、丁寧で的確にアドバイスしてください。関数の提案や修正の解説、エラーの原因分析、目的に合ったやり方の提示など、目的達成に向けたサポートを行ってください。
ユーザーの意図が曖昧な場合は、より的確なアドバイスをするために簡単な質問を返してください。
      `.trim();
      break;

    case 'function':
      basePrompt = `
あなたはExcel関数の専門家です。ユーザーが自然言語で関数の目的を伝えてきたら、それに対応する正しいExcel関数（数式）を1つ以上提示し、それぞれについて何をする関数なのか、どんな場合に適しているかを簡潔に説明してください。
ユーザーはExcel初心者〜中級者であるため、なるべく自然な日本語でわかりやすく解説し、関数の構文や注意点にも触れてください。
解決方法が複数ある場合は、代表的な書き方や関数の違いを比較しながら、選択肢として提示してください。最新のExcel関数（IFS, TEXTSPLITなど）にも対応し、簡潔かつ実用的な関数提案を心がけてください。
ユーザーの意図が曖昧な場合は、適切な関数を導くために簡単な質問を返してください。また、関数を提示した後は「この式で目的は達成できそうですか？」などの聞き返しも行ってください。
      `.trim();
      break;

    case 'vba':
      basePrompt = `
あなたはExcel VBA（マクロ）の専門家です。ユーザーは、日々のExcel業務を自動化したい初心者〜中級者です。
ユーザーが自然言語で処理内容を伝えてくるので、それに対応する正確なVBAコードを Sub ～ End Sub 形式で生成してください。
生成したコードの上に、簡単な説明（何をするコードか）と、必要なら注意点（例：事前設定、参照設定、手動実行 or 自動実行など）を1〜3行程度で添えてください。
コードは読みやすく、できるだけ実用的かつシンプルにしてください。コメントも最低限含め、目的がわかるようにしてください。
ユーザーの説明が曖昧な場合は、正確なコード生成のために確認の質問を返してください。また、コード生成後は「ご希望の処理はこれで実現できそうですか？」と聞き返してください。
      `.trim();
      break;

    default:
      basePrompt = `あなたはExcelのアシスタントです。`;
  }

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

  const systemPrompt = `${basePrompt}\n\n${sheetPrompt}`.trim();

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