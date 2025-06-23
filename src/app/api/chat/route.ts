'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hints = [
    '例：C列の合計を求める関数を教えて',
    '例：空白行を削除するマクロを教えて',
    '例：特定の条件を満たす行を抽出したい',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage.content }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data as string, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log('📄 アップロードされたデータ:', jsonData);

      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonData }),
      });
    };
    reader.readAsBinaryString(file);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-screen-sm text-center mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">FormulaMate</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">自然言語で関数・マクロを生成するExcelアシスタント</p>
      </div>

      <div className="w-full max-w-screen-sm bg-white rounded-xl shadow-md p-4 mb-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-screen-sm flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hints[hintIndex]}
          className="flex-1 border rounded-l px-3 py-2 text-sm"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
          title="ファイルをアップロード"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-r text-sm hover:bg-blue-700"
        >
          送信
        </button>
      </div>

      {fileName && (
        <div className="w-full max-w-screen-sm text-left mt-2 text-sm text-gray-600">
          📄 アップロード済み: {fileName}
        </div>
      )}

      {loading && <div className="text-sm text-gray-500 mt-2">💬 回答を生成中...</div>}
    </main>
  );
}