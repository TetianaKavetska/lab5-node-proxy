
const http = require('http');
const { Command } = require('commander');
const fs = require('node:fs/promises');
const path = require('node:path');
const superagent = require('superagent');

const program = new Command();

program
  .requiredOption('-h, --host <address>', 'Адреса сервера')
  .requiredOption('-p, --port <number>', 'Порт сервера')
  .requiredOption('-c, --cache <path>', 'Папка кешу');

program.parse(process.argv);

const options = program.opts();

async function startServer() {
  try {
    await fs.mkdir(options.cache, { recursive: true });

    const server = http.createServer(async (req, res) => {
      try {
        if (req.method !== 'GET') {
          res.writeHead(405, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Allow': 'GET'
          });
          res.end('Метод поки не підтримується');
          return;
        }

        const match = /^\/([1-5][0-9]{2})$/.exec(req.url);

        if (!match) {
          res.writeHead(404);
          res.end('Invalid image code');
          return;
        }

        const code = match[1];
        const filePath = path.join(options.cache, `${code}.jpg`);

        let image;

        try {
          image = await fs.readFile(filePath);

          res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'X-Cache': 'HIT'
          });
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }

          try {
            const response = await superagent
              .get(`https://http.cat/${code}`)
              .buffer(true)
              .parse(superagent.parse.image);

            image = response.body;

            await fs.writeFile(filePath, image);

            res.writeHead(200, {
              'Content-Type': 'image/jpeg',
              'X-Cache': 'MISS'
            });
          } catch (fetchError) {
            console.error('Помилка отримання:', fetchError.message);

            res.writeHead(404, {
              'Content-Type': 'text/plain; charset=utf-8'
            });
            res.end('Картинку не знайдено');
            return;
          }
        }

        res.end(image);
      } catch (error) {
        console.error('Помилка:', error.message);

        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end('Internal Server Error');
      }
    });

    server.listen(Number(options.port), options.host);

    console.log('Сервер запущено');
  } catch (error) {
    console.error('Помилка:', error.message);
    process.exitCode = 1;
  }
}

startServer();


