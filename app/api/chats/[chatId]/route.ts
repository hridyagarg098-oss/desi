import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: chat } = await supabase
    .from('chats')
    .select('id, user_id, character_id')
    .eq('id', chatId)
    .single()

  if (!chat || chat.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ messages: messages || [] })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('chats').delete().eq('id', chatId).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
