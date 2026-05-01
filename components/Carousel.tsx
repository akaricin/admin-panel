'use client'

import { useEffect, useState, useRef } from 'react'
import { ImageIcon, Sparkles } from 'lucide-react'

interface CaptionCard {
  id: string | number
  imageUrl: string | null
  caption: string
  flavor: string
}

interface Props {
  items: CaptionCard[]
}

export default function Carousel({ items }: Props) {
  // To create an infinite feel, we double the items
  const doubledItems = [...items, ...items, ...items]

  return (
    <div className="relative w-full overflow-hidden py-12">
      {/* Gradient Overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />

      {/* The Scrolling Track */}
      <div className="flex animate-scroll-right hover:pause-scroll">
        {doubledItems.map((item, idx) => (
          <div 
            key={`${item.id}-${idx}`}
            className="flex-shrink-0 w-[400px] px-4"
          >
            <div className="h-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.05)] hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-500 group flex flex-col gap-4">
              {/* Thumbnail */}
              <div className="h-40 w-full rounded-2xl bg-black/40 overflow-hidden border border-white/5 relative">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt="Caption Ref" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-white/5" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-[9px] font-black text-slate-950 uppercase tracking-widest shadow-lg">
                    {item.flavor}
                  </span>
                </div>
              </div>

              {/* Caption Text */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-emerald-400 opacity-50" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Generated Caption</span>
                </div>
                <p className="text-sm font-bold text-emerald-400/90 leading-relaxed italic line-clamp-3">
                  &quot;{item.caption}&quot;
                </p>
              </div>

              {/* Footer Decoration */}
              <div className="h-1 w-12 bg-emerald-500/20 rounded-full group-hover:w-20 group-hover:bg-emerald-500/50 transition-all duration-500" />
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes scroll-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-400px * ${items.length})); }
        }
        .animate-scroll-right {
          animation: scroll-right 100s linear infinite;
        }
        .pause-scroll {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
