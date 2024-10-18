# papertrail

Dot matrix-powered weekly news sum

> Note: due to the arm32 system on the Raspberry Pi Zero W, `bun` is not supported. Otherwise I'd use its much better APIs.

### Setup

1. Install Node.js.

In my case, this is on a [Raspberry Pi Zero W](https://vilros.com/products/raspberry-pi-zero-w-basic-starter-kit-1), so I followed [this script](https://gist.github.com/mandrean/71f2cbf707025a5983c0fc04d78f3e9a).

2. Install dependencies.

```bash
npm install
```

3. Run the script.

```bash
npm start

# optionally, use pm2 to keep it running
pm2 start index.js --name papertrail
```
