export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-10">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Excel関数ジェネレーター
      </h1>

      <p className="mb-6 text-gray-600 text-center max-w-md">
        日本語で自然に指示するだけで、Excel関数式やマクロコードを生成します。
      </p>

      <iframe
        src="https://udify.app/chat/umrL6TAHyE9xS3A6"
        width="100%"
        height="600"
        className="rounded-xl border shadow bg-white"
      />
    </main>
  );
}