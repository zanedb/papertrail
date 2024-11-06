import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getEvents, getEventsFeed, addEvents } from './calendar.js'

const app = express()
const PORT = 3000

app.use(express.json())

const execPromise = promisify(exec)

const startup = async () => {
  console.log('Starting...')
  try {
    await execPromise('sudo chmod 666 /dev/usb/lp0')
    console.log(`Enabled write permissions for /dev/usb/lp0`)
  } catch (error) {
    console.log(`Error enabling write permissions for /dev/usb/lp0: ${error}`)
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

const print = async (feed) => {
  // TODO: figure out line delineation
  // max of 80 chars per line
  try {
    await execPromise(`echo "${feed}" > /dev/usb/lp0`)
    return { code: 200, message: `Successfully sent "${feed}" to /dev/usb/lp0` }
  } catch (error) {
    return { code: 500, message: `Error executing command: ${error}` }
  }
}

app.get('/api/events', async (req, res) => {
  const date = req.query.date

  if (!date) {
    return res.status(400).send('date is required')
  }

  try {
    const events = await getEvents(date)
    res.json(events)
  } catch (error) {
    if (error.message === 'not found') {
      return res.status(404).send('not found')
    }
    res.status(500).send('Server Error')
  }
})

app.post('/api/events', async (req, res) => {
  const { date, events } = req.body

  if (!date) {
    return res.status(400).send('date is required')
  }

  if (!events || !Array.isArray(events)) {
    return res.status(400).send('events are required')
  }

  console.log('cleared validation')

  try {
    const addedEvents = await addEvents(date, events)
    console.log('success, addedEvents:', addedEvents)
    res.json(addedEvents)
  } catch (error) {
    res.status(500).send('Server Error')
  }
})

app.post('/api/print', async (req, res) => {
  const { feed } = req.body

  if (!feed) {
    return res.status(400).send('feed is required')
  }

  const response = await print(feed)
  res.status(response.code).send(response.message)
})

app.use((req, res) => {
  res.status(404).send('not found')
})

startup()
