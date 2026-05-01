const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
  const uid = event.queryStringParameters?.uid
  if (!uid) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No uid provided' }) }
  }

  // Look up member by token
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('token', uid)
    .maybeSingle()

  if (memberError || !member) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Member not found' }) }
  }

  // GET — return tracker data
  if (event.httpMethod === 'GET') {
    const { data: row } = await supabase
      .from('tracker_data')
      .select('data')
      .eq('member_id', member.id)
      .maybeSingle()

    // Update last_active
    await supabase.from('members').update({ last_active: new Date().toISOString() }).eq('id', member.id)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: row?.data || {}, member: { name: member.name, email: member.email } }),
    }
  }

  // POST — save tracker data
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')

    const { error } = await supabase
      .from('tracker_data')
      .upsert({ member_id: member.id, data: body.data, updated_at: new Date().toISOString() }, { onConflict: 'member_id' })

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 405, body: 'Method not allowed' }
}
