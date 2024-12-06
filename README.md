# papertrail

Printing API for my [KX-P2123](https://www.nefec.org/upm/printers/mpa223.htm) dot matrix printer. It listens for requests on `/print/text` and `/print/image` and does what you'd imagine, though the images print in glorious 80-char ASCII instead of digital.

I use these endpoints in several Shortcuts I've written, such as for my weekly calendar.

> Note: due to the arm32 system on the Raspberry Pi Zero W, `bun` is not supported. Otherwise I'd use its much better APIs.

### API Spec

#### POST `/print/text`

If authorization token is specified in `.env`, will require a `Authorization: Bearer <TOKEN>` header.

Example request body:

```json
{
  "feed": "Hello, world! I'm printing on dot-matrix!\n\n\nThree lines later, I'm still here!"
}
```

This will return `200 OK` if the text prints, otherwise a corresponding error.

#### POST `/print/image`

If authorization token is specified in `.env`, will require a `Authorization: Bearer <TOKEN>` header.

The request must be sent as `multipart/form-data` with a `image` field containing the image.

This will return `200 OK` if the image prints, otherwise a corresponding error.

### Setup

1. Install Node.js.

In my case, this is on a [Raspberry Pi Zero W](https://vilros.com/products/raspberry-pi-zero-w-basic-starter-kit-1), so I followed [this script](https://gist.github.com/mandrean/71f2cbf707025a5983c0fc04d78f3e9a).

2. Install dependencies.

```bash
npm install
npm install -g pm2
```

3. Create `.env` and include your version of the following:

```sh
TZ=America/Los_Angeles
TOKEN=CHANGE_THIS
PORT=3000
```

3. Run the script.

```bash
npm start
```

4. For long-term use, use `pm2` to daemonize it.

```sh
pm2 start index.js --name papertrail
pm2 startup
pm2 save
```
