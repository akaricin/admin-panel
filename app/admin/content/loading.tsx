import { Loader2, LayoutGrid } from 'lucide-react'

export default function ContentLoading() {
  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
        <Loader2 className="h-12 w-12 text-emerald-400 animate-spin relative" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl text-white italic font-black uppercase tracking-widest">
          Syncing Content
        </h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
          Retrieving all images from master vault...
        </p>
      </div>
    </div>
  )
}
