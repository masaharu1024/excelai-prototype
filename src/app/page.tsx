// 完全統一版 page.tsx + 初期質問例表示
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Brain,
  FunctionSquare,
  Settings,
  Paperclip,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

function Modal({ title, content, onClose }: { title: string; content: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md border border-gray-200 pointer-events-auto">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div className="text-sm text-gray-700 mb-4">{content}</div>
        <button onClick={onClose} className="text-blue-600 hover:underline text-sm">閉じる</button>
      </div>
    </div>
  );
}

// ここからHomeコンポーネント
export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [mode, setMode] = useState<'advisor' | 'function' | 'vba'>('advisor');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modeIcons = {
    advisor: <Brain size={18} />, function: <FunctionSquare size={18} />, vba: <Settings size={18} />,
  };

  const modeLabels = {
    advisor: 'アドバイザー', function: '関数メーカー', vba: 'VBAメーカー',
  };

  const modeDescriptions = {
    advisor: '自然文の質問に柔軟に対応します。',
    function: 'Excel関数を簡潔に生成します。',
    vba: 'Excelマクロ（VBA）コードを出力します。',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAnswer]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, mode }),
    });

    const data = await res.json();
    if (data.text) {
      let i = 0;
      setCurrentAnswer('');
      const interval = setInterval(() => {
        setCurrentAnswer((prev) => {
          const next = prev + data.text[i];
          i++;
          if (i >= data.text.length) {
            clearInterval(interval);
            setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
            setCurrentAnswer('');
            setLoading(false);
          }
          return next;
        });
      }, 15);
    } else {
      setLoading(false);
    }
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
      workbook.SheetNames.forEach((name) => {
        const sheet = workbook.Sheets[name];
        allSheets[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      });
      await fetch('/api/chat', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: allSheets }),
      });
    };
    reader.readAsBinaryString(file);
  };

  const renderMessage = (msg: { role: string; content: string }, i: number) => {
    const isUser = msg.role === 'user';
    return (
      <div key={i} className={`text-sm whitespace-pre-wrap break-words mb-2 ${isUser ? 'ml-auto bg-gray-200 text-gray-900 rounded px-3 py-2 max-w-[85%]' : 'text-gray-800'}`}>
        {msg.content}
      </div>
    );
  };

  return (
    <main className="bg-white min-h-screen flex flex-col items-center p-4">
      {/* ヘッダー */}
      <div className="w-full max-w-screen-sm flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 relative">
          <span className="text-xl font-bold">FormulaMate</span>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={() => setShowModeSelect(!showModeSelect)}>{modeIcons[mode]}</button>
          {showModeSelect && (
            <div className="absolute left-12 top-10 w-64 border rounded-md bg-white shadow text-sm z-20">
              {(['advisor', 'function', 'vba'] as const).map((m) => (
                <div key={m} className={`flex items-start gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer ${mode === m ? 'bg-gray-50' : ''}`} onClick={() => { setMode(m); setShowModeSelect(false); }}>
                  <div className="mt-1">{modeIcons[m]}</div>
                  <div>
                    <div className="font-semibold">{modeLabels[m]}</div>
                    <div className="text-xs text-gray-500">{modeDescriptions[m]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  <div className="flex gap-2 items-center">
  <button
    className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-black"
    onClick={() => setShowGuide(true)}
  >
    <HelpCircle size={18} />
  </button>
  <button
    className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-black"
    onClick={() => setShowNotice(true)}
  >
    <AlertTriangle size={18} />
  </button>
  <a
    href="https://forms.gle/vELKu9wM3RCFosGm8"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-md transition"
  >
    フィードバックに協力する
  </a>
</div>
      </div>

      {/* モーダル */}
      {showGuide && (
        <Modal
          title="使い方ガイド"
          content={
            <div className="space-y-3 text-sm text-gray-700">
              <h3 className="font-bold">使い方のポイント</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>OpenAIの最新モデル（GPT-4o）を使用しています。</li>
                <li>モード切替で目的に応じた回答が得られます：
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>アドバイザー：自然文の質問に柔軟に対応</li>
                    <li>関数メーカー：Excel関数のみを簡潔に出力</li>
                    <li>VBAメーカー：Excelマクロコードを生成</li>
                  </ul>
                </li>
                <li>Excelファイルをアップロードすると複数シートをまとめて解析できます。</li>
                <li>自然文でそのまま質問できます（例：「平均点を出したい」）。</li>
                <li>出力された関数やVBAはコピーしてExcelにそのまま貼り付け可能です。</li>
              </ul>
            </div>
          }
          onClose={() => setShowGuide(false)}
        />
      )}

      {showNotice && (
        <Modal
          title="ご利用上の注意"
          content={
            <div className="space-y-3 text-sm text-gray-700">
              <h3 className="font-bold">ご利用上の注意</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>アップロードされたファイルや質問内容は保存されません。</li>
                <li>データは回答生成のために一時的に処理され、完了後に破棄されます。</li>
                <li>ページを再読み込みするとアップロード情報はリセットされます。</li>
                <li>複雑な質問や長文の場合、処理に時間がかかることがあります。</li>
                <li>出力内容は参考情報です。業務で使用する場合はご自身で確認のうえご利用ください。</li>
              </ul>
            </div>
          }
          onClose={() => setShowNotice(false)}
        />
      )}

      <hr className="w-full max-w-screen-sm border-t border-gray-300 mb-3" />
      <div className="w-full max-w-screen-sm flex-1 overflow-y-auto space-y-2 mb-2 bg-gray-50 p-3 rounded-md shadow-inner">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 mb-2 space-y-2">
            <p><strong>FormulaMate は、あなたの曖昧な疑問からでも Excelの関数やVBAコードを自動生成できるAIです。</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>「前月の売上ってどう出すの？」<br className="sm:hidden" />→ 日付関数を含む式を自動生成</li>
              <li>「3つの条件で評価したい」<br className="sm:hidden" />→ IF関数をネストした複雑な式も対応</li>
              <li>「複数の部署でVLOOKUPを使いたい」<br className="sm:hidden" />→ 別シートを参照する式を自動作成</li>
              <li>「毎月新しいシートに処理をかけたい」<br className="sm:hidden" />→ マクロ（VBA）で自動化が可能</li>
            </ul>
            <p>ファイルをアップロードすれば、その内容に合わせてより具体的な関数や処理も提案できます。</p>
          </div>
        )}
        {messages.map(renderMessage)}
        {currentAnswer && <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{currentAnswer}</div>}
        {loading && <div className="text-sm text-gray-500">💬 生成中...</div>}
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
          placeholder="質問を入力"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          送信
        </button>
      </div>

      {fileName && <p className="text-xs text-gray-500 mt-1 w-full max-w-screen-sm text-left pl-1">📎 {fileName} をアップロード済み</p>}
    </main>
  );
}