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
