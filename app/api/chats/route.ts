import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: chats, error } = await supabase
    .from('chats')
    .select('id, character_id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ chats })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { characterId } = await req.json()

  // Return existing chat if already exists for this character
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('user_id', user.id)
    .eq('character_id', characterId)
    .single()

  if (existing) return NextResponse.json({ chatId: existing.id })

  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: user.id, character_id: characterId, title: 'New Chat' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ chatId: data.id })
}
