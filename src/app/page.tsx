'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Paperclip, X } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
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
    const newMessage = { role: 'user', content: input };
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

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log('📄 アップロードされたデータ:', jsonData);

      fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonData }),
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      {/* ヘッダー */}
      <div className="w-full max-w-screen-sm text-center mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">FormulaMate</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
          自然言語で関数・マクロを生成するExcelアシスタント
        </p>
      </div>

      {/* チャットログ（対話風に変更） */}
      <div className="w-full max-w-screen-sm space-y-3 text-sm mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[75%]">
              <div
                className={`text-xs font-semibold mb-1 ${
                  msg.role === 'user' ? 'text-right text-blue-500' : 'text-left text-green-600'
                }`}
              >
                {msg.role === 'user' ? 'あなた' : 'FormulaMate'}
              </div>
              <div
                className={`px-4 py-2 rounded-xl whitespace-pre-wrap shadow text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-gray-900 self-end rounded-br-none'
                    : 'bg-green-100 text-gray-900 self-start rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-500 shadow">
              💬 回答を生成中...
            </div>
          </div>
        )}
      </div>

      {/* 入力欄とファイルアップロード */}
      <div
        className="w-full max-w-screen-sm flex items-center gap-2"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="cursor-pointer text-gray-600 hover:text-black">
          <Paperclip size={20} />
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hints[hintIndex]}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          送信
        </button>
      </div>

      {/* アップロードファイル表示＋削除 */}
      {fileName && (
        <div className="w-full max-w-screen-sm flex justify-between items-center mt-2 bg-gray-100 px-3 py-2 rounded text-sm text-gray-700">
          📄 {fileName}
          <button
            onClick={() => {
              setFileName('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-red-500 hover:text-red-700"
            title="アップロードを取り消す"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}