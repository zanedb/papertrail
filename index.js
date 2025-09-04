import fs from 'fs'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import imageToAscii from 'image-to-ascii'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import DotMatrixPrinter from './printer.js'

dotenv.config()

const printer = new DotMatrixPrinter()

const app = express()
const PORT = process.env.PORT || 3000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
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
  app.use('/print/*', authenticate)
}

const print = async (feed, res) => {
  // Pre-print filters
  feed = feed.replace(`’`, `'`)

  try {
    await printer.printText(feed)
    await printer.formFeed() // New page
    res.status(200).send('Text printed')
  } catch (e) {
    return res.status(500).send(`Error printing text: ${e.message}`)
  }
}

const STATE_FILE = 'last-word.json'

const checkWord = async () => {
  try {
    const req = await fetch('https://api.zanedb.com/wordoftheday')
    const data = await req.json()
    const { word, day } = data

    // Read last printed word from state file
    let lastWord = null
    try {
      if (fs.existsSync(STATE_FILE)) {
        const stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        lastWord = stateData.lastWord
      }
    } catch (e) {
      console.log('Could not read state file, treating as first run')
    }

    // Only print if this word hasn't been printed before
    if (lastWord !== word) {
      // Format the output: word on left, date on right, max 80 chars
      const maxLength = 80
      const dateStr = day
      const totalContentLength = word.length + dateStr.length
      const spacesNeeded = Math.max(1, maxLength - totalContentLength)
      const spaces = ' '.repeat(spacesNeeded)

      const formattedLine = `\n${word}${spaces}${dateStr}\n`

      // Print to console
      console.log(formattedLine)

      // Print to printer
      await printer.printText(formattedLine)

      // Save the word to state file
      const stateData = {
        lastWord: word,
        lastPrinted: new Date().toISOString(),
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2))
    }
  } catch (error) {
    console.error('Error checking word of the day:', error)
  }
}

// Check word every minute (60000ms)
setInterval(checkWord, 60000)

// Check immediately on startup
checkWord()

app.post('/print/text', async (req, res) => {
  const { feed } = req.body

  if (!feed) {
    return response(res, 400, '`feed` is required')
  }

  await print(feed, res)
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

      await print(feed, res)
    }
  )
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use((req, res) => {
  return response(res, 404, 'Endpoint not found')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
