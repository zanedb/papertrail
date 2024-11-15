import fs from 'fs'
import express from 'express'
import multer from 'multer'
import imageToAscii from 'image-to-ascii'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getEvents, getEventsFeed, addEvents } from './calendar.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000
const execPromise = promisify(exec)
app.use(express.json())

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10mb
})

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

const response = (res, code, message) =>
  res.status(code).send({ code, message })

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return response(res, 401, 'Authorization header missing')
  }

  const token = authHeader.split(' ')[1]

  if (!token || token !== process.env.TOKEN) {
    return response(res, 401, 'Unauthorized: invalid or missing token')
  }

  next()
}

if (process.env.TOKEN !== undefined) {
  console.log('Token found, running with Authorization header required')
  app.use('/*', authenticate)
}

const startup = async () => {
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
  // Note: this is an EASY vector for command injection
  // I'm not really worried about it since only I'll be sending data to this server + there's an auth token
  // But keep this in mind if used for more public things
  try {
    await execPromise(`echo "${feed}" > /dev/usb/lp0`)
    return { code: 200, message: `Successfully sent to /dev/usb/lp0`, feed }
  } catch (error) {
    return { code: 500, message: `Error executing command: ${error}`, feed }
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

  try {
    const addedEvents = await addEvents(date, events)
    console.log('success, addedEvents:', addedEvents)
    res.json(addedEvents)
  } catch (error) {
    res.status(500).send('Server Error')
  }
})

app.post('/print/text', async (req, res) => {
  const { feed } = req.body

  if (!feed) {
    return response(res, 400, '`feed` is required')
  }

  // TEMP
  if (feed === 'PRINTEVENTS') {
    const events = await getEventsFeed()
    console.log(events)
    await print('\n\n\n' + events)
    return response(res, 200, 'printed events')
  }

  const kx = await print(feed)
  res.status(kx.code).send(kx)
})

app.post('/print/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return response(res, 400, 'No image provided')
  }

  const imagePath = path.join(__dirname, req.file.path)

  imageToAscii(
    imagePath,
    {
      size: { width: 40 },
    },
    async (err, ascii) => {
      if (err) {
        return response(res, 500, 'Error converting image to ASCII')
      }

      const kx = await print(ascii)
      res.status(kx.code).send(kx)
    }
  )
})

app.use((req, res) => {
  respond(res, 404, 'Endpoint not found')
})

startup()
