'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [excelData, setExcelData] = useState<any[][]>([]); // ← 追加

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { role: 'user', content: input };
    setMessages([...messages, newMessage]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage.content,excelData }),
    });

    const data = await res.json();
    setMessages([...messages, newMessage, { role: 'assistant', content: data.answer }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log('📄 アップロードされたデータ:', jsonData);
      setExcelData(jsonData); // ← 表示用に保存
    };
    reader.readAsBinaryString(file);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-screen-sm text-center mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">FormulaMate</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
          自然言語で関数・マクロを生成するExcelアシスタント
        </p>
      </div>

      <div className="w-full max-w-screen-sm bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">🧠 このアプリでできること</h2>

        <div className="mb-4">
          <h3 className="font-semibold">📊 Excel関数</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>C列の合計</li>
            <li>A列が「売上」の行のD列合計</li>
            <li>B列が空でない行の平均</li>
            <li>E列の日付が今月のものだけのF列平均</li>
            <li>商品ごとの売上合計をSUMIFSで集計</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">⚙️ マクロ（VBA）</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>選択したセルの行を非表示にする</li>
            <li>毎月1日にシートをコピーして新しい月のシートを作成</li>
            <li>空白行をすべて削除</li>
            <li>全シートから「売上」列を探して合計</li>
            <li>条件を満たす行を別シートに抽出</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">📁 アップロード応用</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>アップロードした表で最大の売上を探す</li>
            <li>日付ごとの売上推移を表示する</li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-screen-sm">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="mb-4"
        />
        {fileName && (
          <p className="text-sm mb-2 text-gray-600">📄 アップロード済み: {fileName}</p>
        )}

        <div className="flex mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：C列の合計を求める関数を教えて"
            className="flex-1 border rounded-l px-3 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-r text-sm hover:bg-blue-700"
          >
            送信
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                msg.role === 'user'
                  ? 'bg-blue-100 text-left'
                  : 'bg-green-100 text-left'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* 🔽 アップロードしたExcel表示用 */}
        {excelData.length > 0 && (
          <div className="bg-white rounded shadow p-4 mt-6 w-full overflow-auto text-sm">
            <h3 className="font-semibold mb-2">📄 アップロード内容プレビュー</h3>
            <table className="w-full border border-gray-300 text-xs">
              <tbody>
                {excelData.map((row, i) => (
                  <tr key={i} className="border-b">
                    {row.map((cell, j) => (
                      <td key={j} className="border px-2 py-1 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}