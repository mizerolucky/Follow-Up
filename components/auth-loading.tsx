import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-black">
      <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
      <h2 className="text-xl font-medium text-white">Loading Follow-up</h2>
      <p className="text-blue-300 mt-2">Please wait...</p>
    </div>
  )
}
