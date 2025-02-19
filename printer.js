import { promises as fs } from 'fs'
import { normalize } from 'path'

class DotMatrixPrinter {
  constructor(devicePath = '/dev/usb/lp0') {
    this.devicePath = devicePath
    this.validateDevicePath()
  }

  validateDevicePath() {
    // Ensure the device path is a valid printer device
    const normalizedPath = normalize(this.devicePath)
    if (!normalizedPath.startsWith('/dev/') || normalizedPath.includes('..')) {
      throw new Error('Invalid printer device path')
    }
  }

  async isDeviceAccessible() {
    try {
      await fs.access(this.devicePath, fs.constants.W_OK)
      return true
    } catch {
      return false
    }
  }

  // Print text with basic formatting
  async printText(text) {
    if (typeof text !== 'string') {
      throw new Error('Print content must be a string')
    }

    try {
      if (!(await this.isDeviceAccessible())) {
        throw new Error(`Cannot access printer at ${this.devicePath}`)
      }

      // Common ESC/P commands for the KX-P2123
      const init = '\x1B\x40' // Initialize printer
      const content = init + text + '\r\n'

      // Open, write, and close immediately to prevent device hanging
      const fd = await fs.open(this.devicePath, 'w')
      try {
        await fs.writeFile(fd, content)
      } finally {
        await fd.close()
      }
    } catch (err) {
      console.error('Printing failed:', err)
      throw err
    }
  }

  // Set different print modes using ESC/P commands
  async setPrintMode(text, options = {}) {
    let formattedText = text

    // ESC/P commands for KX-P2123
    const commands = {
      init: '\x1B\x40', // Initialize printer
      nlq: '\x1B\x78\x31', // Near Letter Quality mode
      draft: '\x1B\x78\x30', // Draft mode
      bold: '\x1B\x45', // Bold on
      boldOff: '\x1B\x46', // Bold off
      wide: '\x1B\x57\x31', // Double-width on
      wideOff: '\x1B\x57\x30', // Double-width off
    }

    let prefix = commands.init

    if (options.nlq) prefix += commands.nlq
    if (options.bold) prefix += commands.bold
    if (options.wide) prefix += commands.wide

    let suffix = ''
    if (options.bold) suffix += commands.boldOff
    if (options.wide) suffix += commands.wideOff

    formattedText = prefix + formattedText + suffix + '\r\n'

    await this.printText(formattedText)
  }

  // Form feed
  async formFeed() {
    await this.printText('\x0C')
  }
}

export default DotMatrixPrinter
