const express = require('express');
const path = require('path');
const localIpAddress = require("local-ip-address");
const chalk = require('chalk');

const app = express();
const port = 4001;

const { mkdirAsync, writeFileAsync, getPlaylists, createPlaylist, getLayout, presentPage } = require('./controllers/controller')

app.use(express.json());

app.set('view engine', 'ejs');
app.use('/assets', express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    var d = new Date(Date.now());
    console.log(chalk.yellowBright(d.toString().split('GMT')[0].split(' ')[4], req.method, req.url))
    next()
});

app.get('/playlists', getPlaylists);

app.get('/present', presentPage);

app.post('/create', createPlaylist);

app.get('/layout', getLayout);

app.listen(port, () => {
    var d = new Date(Date.now());
    console.log(d.toString().split('GMT')[0].trim(), `Lagezentrum running on ${localIpAddress()}:${port}`);
    console.log(chalk.redBright(`
    ██████  ██ ██      ██████      ███████ ██████ ██ 
    ██   ██ ██ ██      ██   ██     ██      ██  ██ ██ 
    ██████  ██ ██      ██   ██     █████   ██████ ██ 
    ██   ██ ██ ██      ██   ██     ██      ██     ██ 
    ██████  ██ ███████ ██████      ███████ ██     ██ 
    `))
});