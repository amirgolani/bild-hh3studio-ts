const express = require('express');
const path = require('path');

const app = express();

const { mkdirAsync, writeFileAsync, getPlaylists, createPlaylist, getLayout, presentPage } = require('./controller')

app.use(express.json());

app.set('view engine', 'ejs');
app.use('/assets', express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    var d = new Date(Date.now());
    console.log(d.toString().split('GMT')[0].split(' ')[4], req.method, req.url)
    next()
});

app.get('/playlists', getPlaylists);

app.get('/present', presentPage);

app.post('/create', createPlaylist);

app.get('/layout', getLayout);

app.listen(4001, () => {
    console.log(`Playlists Server Running on port ${4001}`);
});