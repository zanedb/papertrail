# papertrail

Printing API for my [KX-P2123](https://www.nefec.org/upm/printers/mpa223.htm) dot matrix printer. It listens for requests on `/print/text` and `/print/image` and does what you'd imagine, though the images print in glorious 80-char ASCII.

I use these endpoints in several Shortcuts I've written, such as for my weekly newsfeed/calendar.

> Note: due to the arm32 system on the Raspberry Pi Zero W, `bun` is not supported. Otherwise I'd use its much better APIs.

### Setup

1. Install Node.js.

In my case, this is on a [Raspberry Pi Zero W](https://vilros.com/products/raspberry-pi-zero-w-basic-starter-kit-1), so I followed [this script](https://gist.github.com/mandrean/71f2cbf707025a5983c0fc04d78f3e9a).

2. Install dependencies.

```bash
npm install
npm install -g pm2
```

3. Run the script.

```bash
npm start

# optionally, use pm2 to keep it running
pm2 start index.js --name papertrail
```
