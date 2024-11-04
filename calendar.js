import fs from 'fs/promises'
import path from 'path'

const today = new Date()

// we'll use this to display each day's info
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf())
  date.setDate(date.getDate() + days)
  return date
}

// returns 2024-01-01 format
Date.prototype.isoFormat = function () {
  return this.toISOString().substring(0, 10)
}

// returns Monday, Jan 1, 2024 format
// OR Monday format if full is false
// MARK: at least it should
Date.prototype.prettyFormat = function (full = true) {
  return full
    ? this.toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : this.toLocaleDateString('en-us', {
        weekday: 'long',
      })
}

// fetches the next 7 days of events from specified date
export const getEvents = async (date) => {
  const filePath = path.join('data', `${new Date(date).isoFormat()}.json`)

  try {
    const fileStats = await fs.stat(filePath)
    if (fileStats.size === 0) throw new Error('not found')

    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('not found')
    }
    throw error
  }
}

// formats into feed for printing
export const getEventsFeed = async () => {
  const events = await getEvents(today)
  const days = [1, 2, 3, 4, 5, 6, 7]
  let feed = `Week of ${today.addDays(1).prettyFormat()}\n\n`

  days.map((day) => {
    const date = today.addDays(day)
    const filtered = events.filter(
      (event) => event.startDate.substring(0, 10) === date.isoFormat()
    )

    if (filtered.length > 0) {
      feed += `${date.prettyFormat(false)}\n`
      feed += filtered
        .map((event) => {
          return `${event.title} - ${event.startDate}`
        })
        .join('\n')
      feed += '\n\n'
    }
  })

  console.log(feed)
  return feed
}

// adds 7 days worth of events to a dated json file
export const addEvents = async (date, events) => {
  const filePath = path.join('data', `${today.isoFormat()}.json`)
  await fs.writeFile(filePath, JSON.stringify(events))
  return events
}
