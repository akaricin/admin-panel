import { adminSupabase } from '@/lib/admin-supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { image_id } = await request.json()

    if (!image_id) {
      return NextResponse.json({ error: 'image_id is required' }, { status: 400 })
    }

    // Fetch the current humor mix (weights/settings)
    const { data: humorMix, error: humorError } = await adminSupabase
      .from('humor_flavor_mix')
      .select('*')
      .order('created_datetime_utc', { ascending: false })

    if (humorError) {
      console.error('Error fetching humor mix:', humorError)
      return NextResponse.json({ error: 'Failed to fetch humor mix' }, { status: 500 })
    }

    // Return the required response for Phase 3 integration
    return NextResponse.json({ 
      message: 'Ready for integration',
      image_id,
      active_humor_mix: humorMix,
      status: 'scaffold_complete'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
