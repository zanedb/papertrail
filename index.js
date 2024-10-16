const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const path = new URL(req.url).pathname

    if (req.method === 'GET' && path === '/api/events') {
      const { searchParams } = new URL(req.url)

      if (!searchParams.get('date'))
        return new Response('date is required', { status: 400 })

      const events = await getEvents(searchParams.get('date'))
      return new Response(JSON.stringify(events))
    }

    if (req.method === 'POST' && path === '/api/events') {
      const body = await req.json()

      if (!body.date) return new Response('date is required', { status: 400 })

      if (!body.events || !Array.isArray(body.events))
        return new Response('events are required', { status: 400 })

      const think = await addEvents(body.date, body.events)
      return new Response(think)
    }

    return new Response('not found', { status: 404 })
  },
})

const getEvents = (date) => {
  const d = new Date(date)
  const file = Bun.file(`data/${d.toISOString()}.json`, {
    type: 'application/json',
  })

  if (file.size === 0) return new Response('not found', { status: 404 })

  console.log(file.size)

  return {
    events: [],
  }
}

const addEvents = async (date, events) => {
  return events
}

// Print
// const data = `Hello world`
// await Bun.write('/dev/usb/lp0', data)
