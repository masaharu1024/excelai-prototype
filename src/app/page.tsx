// src/app/page.tsx

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-start">
      <div className="w-full max-w-screen-sm text-center mt-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Excel関数ジェネレーター</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
          日本語で自然に指示するだけで、Excel関数式やマクロコードを生成します。
        </p>
      </div>

      <div className="w-full max-w-screen-sm aspect-[3/4] sm:aspect-video">
        <iframe
          src="https://udify.app/chat/umrL6TAHyE9xS3A6"
          width="100%"
          height="100%"
          className="rounded-xl border shadow bg-white w-full h-full"
        />
      </div>
    </main>
  );
}