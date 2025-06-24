// ✅ 最新UI対応版：page.tsx（モデル選択＋説明付き + モード切替 + 応答送信）

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Brain,
  FunctionSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const modelDescriptions = {
  'gpt-4o': '高精度で応答も速い、バランス重視のモデル',
  'gpt-4': '精度は高いがやや遅め、丁寧な処理向き',
  'gpt-3.5-turbo': '応答が非常に速い、軽い用途や試用におすすめ',
};

type ChatMessage = {
  role: string;
  content: string;
};

type ChatResponse = {
  text: string;
  error?: boolean;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [mode, setMode] = useState<'advisor' | 'function' | 'vba'>('advisor');
  const [model, setModel] = useState<'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo'>('gpt-4o');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modeLabels = {
    advisor: 'アドバイザー',
    function: '関数メーカー',
    vba: 'VBAメーカー',
  };

  const modeIcons = {
    advisor: <Brain size={18} />,
    function: <FunctionSquare size={18} />,
    vba: <Settings size={18} />,
  };

  const modeDescriptions = {
    advisor: '曖昧な質問や関数以外の質問にも丁寧にアドバイスします。',
    function: '数式に特化して、簡潔に関数を生成します。',
    vba: 'Excelマクロ（VBA）に特化したコードを出力します。',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, mode, model }),
    });

    const data: ChatResponse = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const allSheets: Record<string, unknown[][]> = {};
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        allSheets[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      });
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: allSheets }),
      });
    };
    reader.readAsBinaryString(file);
  };

  const renderMessage = (msg: ChatMessage, i: number) => {
    const isUser = msg.role === 'user';
    const isCode = msg.content.includes('=') || msg.content.includes('Sub ');

    return (
      <div
        key={i}
        className={`w-fit max-w-[85%] break-words px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
          isUser ? 'ml-auto bg-gray-200 text-gray-900' : 'mr-auto bg-gray-100 text-gray-800'
        }`}
        style={{
          overflowX: 'hidden',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {isCode ? (
          <SyntaxHighlighter
            language="vbscript"
            style={atomOneLight}
            customStyle={{
              background: 'transparent',
              padding: 0,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'hidden',
            }}
          >
            {msg.content}
          </SyntaxHighlighter>
        ) : (
          msg.content
        )}
      </div>
    );
  };

  return (
    <main className="bg-white min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-screen-sm text-center mb-2">
        <h1 className="text-3xl font-bold mb-1">FormulaMate</h1>
        <p className="text-sm text-gray-500">自然言語でExcel関数・マクロを生成</p>
      </div>

      {/* モード選択UI */}
      <div className="w-full max-w-screen-sm mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3">
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-gray-50 hover:bg-gray-100"
            onClick={() => setShowModeSelect(!showModeSelect)}
          >
            {modeIcons[mode]}
            {modeLabels[mode]}
            {showModeSelect ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showModeSelect && (
            <div className="absolute left-0 top-full mt-1 border rounded-md bg-white shadow text-sm z-10 w-48">
              {(['advisor', 'function', 'vba'] as const).map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setMode(m);
                    setShowModeSelect(false);
                  }}
                >
                  {modeIcons[m]}
                  {modeLabels[m]}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">{modeDescriptions[mode]}</p>
      </div>

      {/* モデル選択UI */}
      <div className="w-full max-w-screen-sm mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3">
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-gray-50 hover:bg-gray-100"
            onClick={() => setShowModelSelect(!showModelSelect)}
          >
            🧠 {model}
            {showModelSelect ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showModelSelect && (
            <div className="absolute left-0 top-full mt-1 border rounded-md bg-white shadow text-sm z-10 w-64">
              {(['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'] as const).map((m) => (
                <div
                  key={m}
                  className="flex flex-col px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setModel(m);
                    setShowModelSelect(false);
                  }}
                >
                  <span className="font-semibold">{m}</span>
                  <span className="text-xs text-gray-500">{modelDescriptions[m]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">{modelDescriptions[model]}</p>
      </div>

      <hr className="w-full max-w-screen-sm border-t border-gray-300 mb-3" />

      <div className="w-full max-w-screen-sm flex-1 overflow-y-auto space-y-2 mb-2 bg-gray-50 p-3 rounded-md shadow-inner">
        {messages.map(renderMessage)}
        {loading && <div className="text-sm text-gray-500">💬 回答を生成中...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full max-w-screen-sm flex items-center gap-2 mt-auto">
        <label className="cursor-pointer text-gray-600 hover:text-black">
          <Paperclip size={20} />
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="質問を入力（例：社員名で評価をVLOOKUP）"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          送信
        </button>
      </div>

      {fileName && (
        <p className="text-xs text-gray-500 mt-1 w-full max-w-screen-sm text-left pl-1">
          📎 {fileName} をアップロード済み
        </p>
      )}
    </main>
  );
}