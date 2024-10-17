# papertrail

Dot matrix-powered weekly news sum

### Setup

1. Install Node.js.

In my case, this is on a [Raspberry Pi Zero W](https://vilros.com/products/raspberry-pi-zero-w-basic-starter-kit-1), so I followed [this script](https://gist.github.com/mandrean/71f2cbf707025a5983c0fc04d78f3e9a).

2. Install bun & dependencies.

```bash
npm install -g bun
bun i
```

3. Run the script.

```bash
bun start

# optionally, use pm2 to keep it running
pm2 start index.js --name papertrail
```
