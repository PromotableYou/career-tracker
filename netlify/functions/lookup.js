const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No email provided' }) }
  }

  const { data: member } = await supabase
    .from('members')
    .select('token')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!member) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Member not found' }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: member.token }),
  }
}
