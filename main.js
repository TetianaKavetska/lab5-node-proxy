const http = require('http');
const { Command } = require('commander');
const fs = require('node:fs/promises');

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
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
      });

      res.end('Сервер працює!');
    });

    server.listen(Number(options.port), options.host);

    console.log('Сервер запущено');
  } catch (error) {
    console.error('Помилка:', error.message);
    process.exitCode = 1;
  }
}

startServer();
