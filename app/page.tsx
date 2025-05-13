import AuthSlide from "@/components/auth-slide"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-animate bg-gradient-to-br from-blue-900 via-blue-950 to-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">Follow-up</h1>
          <p className="mt-2 text-blue-300">Chat in real-time, one message at a time</p>
        </div>

        <AuthSlide />

        <div className="text-center text-sm text-blue-400 max-w-sm mx-auto">
          <p>One message replaces the previous. Choose your words wisely.</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
        <div className="absolute top-[10%] left-[15%] w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] right-[15%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[15%] left-[35%] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>
    </main>
  )
}
