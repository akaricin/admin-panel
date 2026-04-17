import { adminSupabase } from '@/lib/admin-supabase'
import Carousel from '@/components/Carousel'

export const revalidate = 0 // Fresh data on every refresh

export default async function HomePage() {
  // 1. Fetch from captions table with specific columns
  const { data: rawCaptions } = await adminSupabase
    .from('captions')
    .select('id, caption_text, metadata, humor_flavor_id, image_id')
    .order('created_at', { ascending: false })
    .limit(30) // Fetch a pool to shuffle from

  const captionsData = rawCaptions || []
  
  // 2. Extract specific IDs for lookup
  const imageIds = [...new Set(captionsData.map(c => c.image_id).filter(Boolean))]
  const flavorIds = [...new Set(captionsData.map(c => c.humor_flavor_id).filter(Boolean))]

  // 3. Fetch related records
  const [flavorsRes, imagesRes] = await Promise.all([
    adminSupabase.from('humor_flavors').select('id, name').in('id', flavorIds),
    adminSupabase.from('images').select('id, url').in('id', imageIds)
  ])

  const flavors = flavorsRes.data || []
  const images = imagesRes.data || []

  // 4. Create lookup maps
  const flavorMap = new Map(flavors.map(f => [String(f.id), f.name]))
  const imageMap = new Map((images || []).map(i => [String(i.id), i.url]))

  // 5. Parse and Clean Captions
  const parseCaption = (item: any) => {
    let text = item.caption_text
    
    // If caption_text is null, try parsing metadata
    if (!text && item.metadata) {
      try {
        const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
        
        // Extract topic_summary from caption_topic_plan as fallback
        if (meta?.caption_topic_plan?.topic_summary) {
          text = meta.caption_topic_plan.topic_summary
        } else if (meta?.topic_summary) {
          text = meta.topic_summary
        } else if (typeof meta === 'string') {
          text = meta
        } else {
          text = JSON.stringify(meta)
        }
      } catch (e) {
        text = String(item.metadata)
      }
    }

    // UI Cleanup: Remove any curly braces, quotes, or key names
    if (text) {
      // Basic JSON cleanup if it leaked through
      text = text.replace(/\{.*\}/g, '')
      text = text.replace(/["']/g, '')
      text = text.replace(/topic_summary:/g, '')
      text = text.trim()
    }

    return text || 'Untitled Caption'
  }

  // 6. Final Assembly & Shuffle
  let carouselItems = captionsData.map(c => ({
    id: c.id,
    caption: parseCaption(c),
    flavor: flavorMap.get(String(c.humor_flavor_id)) || 'Standard',
    imageUrl: imageMap.get(String(c.image_id)) || null
  }))
  .filter(item => item.caption.length > 5 && !item.caption.includes('{'))

  // Pseudo-Random Shuffle and Limit to 15
  carouselItems = carouselItems
    .sort(() => Math.random() - 0.5)
    .slice(0, 15)

  // 7. High-Quality MOCK Fallback if empty
  if (carouselItems.length < 5) {
    const mocks = [
      { id: 'm1', flavor: 'Sarcastic', caption: "Oh look, another photo of your coffee. Revolutionary.", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80" },
      { id: 'm2', flavor: 'Dad Joke', caption: "I'm reading a book on anti-gravity. It's impossible to put down!", imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80" },
      { id: 'm3', flavor: 'Witty', caption: "My bed is a magical place where I suddenly remember everything I forgot to do.", imageUrl: "https://images.unsplash.com/photo-1505691722718-250397cc415c?auto=format&fit=crop&w=800&q=80" },
      { id: 'm4', flavor: 'Sarcastic', caption: "I’m not arguing, I’m just explaining why I’m right.", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" },
      { id: 'm5', flavor: 'Brainrot', caption: "Skibidi toilet rizz in the ohio gyatt. No cap fr fr.", imageUrl: "https://images.unsplash.com/photo-1531214159280-079b95d26139?auto=format&fit=crop&w=800&q=80" }
    ]
    carouselItems = [...carouselItems, ...mocks].slice(0, 15)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      {/* The Carousel Wheel */}
      <section className="w-full max-w-7xl">
        <Carousel items={carouselItems} />
      </section>

      {/* Simplified Text */}
      <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <p className="text-emerald-400/60 font-black uppercase tracking-[0.3em] text-xs">
          Sign in with Google to access the admin area.
        </p>
      </div>
    </div>
  )
}

