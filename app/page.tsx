import { adminSupabase } from '@/lib/admin-supabase'
import Carousel from '@/components/Carousel'

export const revalidate = 3600 // Revalidate once per hour for public page

export default async function HomePage() {
  // 1. Fetch the Latest 20 Model Responses first
  const { data: rawResponses } = await adminSupabase
    .from('llm_model_responses')
    .select('id, llm_model_response, humor_flavor_id, caption_request_id')
    .not('llm_model_response', 'is', null)
    .order('created_datetime_utc', { ascending: false })
    .limit(20)

  const responses = rawResponses || []
  
  // 2. Extract specific IDs needed for the precise "Merge"
  const requestIds = [...new Set(responses.map(r => r.caption_request_id).filter(Boolean))]
  const flavorIds = [...new Set(responses.map(r => r.humor_flavor_id).filter(Boolean))]

  // 3. Precise Fetching for only the records related to these 20 responses
  const [flavorsRes, requestsRes] = await Promise.all([
    adminSupabase.from('humor_flavors').select('id, name').in('id', flavorIds),
    adminSupabase.from('caption_requests').select('id, image_id').in('id', requestIds)
  ])

  const flavors = flavorsRes.data || []
  const requests = requestsRes.data || []
  const imageIds = [...new Set(requests.map(req => req.image_id).filter(Boolean))]
  
  const { data: images } = await adminSupabase
    .from('images')
    .select('id, url')
    .in('id', imageIds)

  // 4. Create lookup maps
  const flavorMap = new Map(flavors.map(f => [String(f.id), f.name]))
  const requestMap = new Map(requests.map(r => [String(r.id), r.image_id]))
  const imageMap = new Map((images || []).map(i => [String(i.id), i.url]))

  // 5. Final Assembly
  let carouselItems = responses.map(r => {
    const imgId = requestMap.get(String(r.caption_request_id))
    const url = imgId ? imageMap.get(String(imgId)) : null
    
    return {
      id: r.id,
      caption: r.llm_model_response || '',
      flavor: flavorMap.get(String(r.humor_flavor_id)) || 'Standard',
      imageUrl: url
    }
  }).filter(item => item.caption.length > 10 && !item.caption.startsWith('['))

  // 6. High-Quality MOCK Fallback
  if (carouselItems.length < 5) {
    const mocks = [
      { id: 'm1', flavor: 'Sarcastic', caption: "Oh look, another photo of your coffee. Revolutionary.", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80" },
      { id: 'm2', flavor: 'Dad Joke', caption: "I'm reading a book on anti-gravity. It's impossible to put down!", imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80" },
      { id: 'm3', flavor: 'Witty', caption: "My bed is a magical place where I suddenly remember everything I forgot to do.", imageUrl: "https://images.unsplash.com/photo-1505691722718-250397cc415c?auto=format&fit=crop&w=800&q=80" },
      { id: 'm4', flavor: 'Sarcastic', caption: "I’m not arguing, I’m just explaining why I’m right.", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" },
      { id: 'm5', flavor: 'Brainrot', caption: "Skibidi toilet rizz in the ohio gyatt. No cap fr fr.", imageUrl: "https://images.unsplash.com/photo-1531214159280-079b95d26139?auto=format&fit=crop&w=800&q=80" }
    ]
    carouselItems = [...carouselItems, ...mocks]
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
