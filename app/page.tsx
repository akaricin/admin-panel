import { adminSupabase } from '@/lib/admin-supabase'
import Carousel from '@/components/Carousel'

export const revalidate = 0 // Fresh data on every refresh

export default async function HomePage() {
  // 1. Fetch total count of captions with images to pick a random starting point
  const { count: totalCaptions } = await adminSupabase
    .from('captions')
    .select('*', { count: 'exact', head: true })
    .not('image_id', 'is', null)

  const randomOffset = totalCaptions 
    ? Math.floor(Math.random() * Math.max(0, totalCaptions - 30)) 
    : 0

  // 2. Single Joined Query: Fetch captions with their images and flavors
  const { data: joinedData, error } = await adminSupabase
    .from('captions')
    .select(`
      id,
      content,
      images (
        url
      ),
      humor_flavors (
        slug
      )
    `)
    .not('image_id', 'is', null)
    .range(randomOffset, randomOffset + 29)

  if (error) {
    console.error('Error fetching carousel data:', error)
  }

  const rawCaptions = joinedData || []

  // 3. Parse and Clean Captions
  const parseCaption = (item: any) => {
    let text = item.content

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


  // 4. Final Assembly
  let carouselItems = rawCaptions.map(c => ({
    id: c.id,
    caption: parseCaption(c),
    flavor: (c.humor_flavors as any)?.slug || 'Standard',
    imageUrl: (c.images as any)?.url || null
  }))
  .filter(item => item.caption.length > 5 && !item.caption.includes('{') && item.imageUrl)

  // Shuffle and Limit to 15-20
  carouselItems = carouselItems
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)

  // 5. High-Quality MOCK Fallback if empty
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

