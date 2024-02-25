const express = require('express');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const fse = require('fs-extra');
const chalk = require('chalk');
const localIpAddress = require("local-ip-address");
const util = require('util');

const app = express();
const port = 4000;

const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);

app.use(express.json());

app.set('view engine', 'ejs');
app.use('/assets', express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    var d = new Date(Date.now());
    console.log(chalk.yellowBright(d.toString().split('GMT')[0].split(' ')[4], req.method, req.url))
    next()
});

app.get('/create', (req, res) => {

    if (!req.query.r) {
        return res.render('select', {
            server: localIpAddress().split('.')[3] === '96' ? 'Big Touchscreen' : 'Small Touchscreen',
            change: localIpAddress().split('.')[3] === '96' ? 'Switch to the small touchscreen' : 'Switch to the big touchscreen',
            newLink: localIpAddress().split('.')[3] === '96' ? 'http://10.29.134.46:4000/create' : 'http://10.29.134.96:4000/create',
        })
    }

    var props = {};

    props.server = localIpAddress().split('.')[3] === '96' ? 'Big Touchscreen' : 'Small Touchscreen';
    props.region = req.query.r
    if (req.query.r === 'one') {
        props.template = ['Background Loop', 'Map Gaza']
    }
    else if (req.query.r === 'two') {
        props.template = ['Background Loop', 'MAP Ukraine', 'MAP Osten', 'MAP Süden', 'MAP Awdijiwka', 'MAP Gegenoff.']
    }
    else if (req.query.r === 'three') {
        props.template = ['Background Loop']
    }
    else {
        props.template = ['Background Loop']
    }

    res.render('create', props)
});

app.get('/present', (req, res) => {

    if (!req.query.r) {
        return res.render('select-create', {
            server: localIpAddress().split('.')[3] === '96' ? 'Big Touchscreen' : 'Small Touchscreen',
            change: localIpAddress().split('.')[3] === '96' ? 'Switch to the small touchscreen' : 'Switch to the big touchscreen',
            newLink: localIpAddress().split('.')[3] === '96' ? 'http://10.29.134.46:4000/create' : 'http://10.29.134.96:4000/create',
        })
    }

    res.render('present', {
        region: req.query.r
    })
});

app.post('/create', async (req, res) => {
    const form = new formidable.IncomingForm({
        multiples: true,
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2 GB limit
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing the form:', err);
            return res.status(500).json({ error: 'Error parsing the form' });
        }

        try {
            const storagePath = path.join(__dirname, 'public', `storage-r-${req.query.r}`);
            const dbPath = path.join(__dirname, `db-r-${req.query.r}`);
            const jsonFilePath = path.join(dbPath, 'layout.json');

            // Create directory if it doesn't exist
            if (!fs.existsSync(storagePath)) {
                await mkdirAsync(storagePath);
            }

            // Create directory for JSON file if it doesn't exist
            if (!fs.existsSync(dbPath)) {
                await mkdirAsync(dbPath);
            }

            await fse.emptyDir(dbPath);
            await fse.emptyDir(storagePath);

            const jsonData = [];

            // Iterate over the fields and handle each set of inputs
            for (let i = 1; fields[`name_${i}`] !== undefined; i++) {
                const name = fields[`name_${i}`];
                const mute = fields[`mute_${i}`];
                const loop = fields[`loop_${i}`];
                const ctrl = fields[`ctrl_${i}`];
                const file = files[`file_${i}`];

                if (file) {
                    const newFilePath = path.join(storagePath, file[0].originalFilename);

                    // Move the file to the storage directory
                    await fse.move(file[0].filepath, newFilePath);

                    // Add information to the JSON data
                    jsonData.push({
                        name,
                        mute,
                        loop,
                        ctrl,
                        file: newFilePath,
                    });
                }
            }

            jsonData.unshift({ metadata: { lastUpdate: Date.now() } });

            // Create JSON file
            await writeFileAsync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            var d = new Date(Date.now());
            console.log(chalk.yellowBright(d.toString().split('GMT')[0], `Region ${req.query.r} created`));
            res.json(jsonData);

        } catch (error) {
            console.error('Error processing the request:', error);
            return res.status(500).json({ error: 'Error processing the request' });
        }
    });
});

app.get('/layout', (req, res) => {
    const filePath = path.join(__dirname, `db-r-${req.query.r}`, 'layout.json');

    // Read the file asynchronously
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        try {
            // Parse the file content as JSON
            const jsonData = JSON.parse(data);

            // Send the parsed JSON as the response
            res.json(jsonData);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(port, () => {
    var d = new Date(Date.now());
    console.log(d.toString().split('GMT')[0].trim(), `Lagezentrum running on ${localIpAddress()}:${port}`);
    console.log(chalk.redBright(`
    ██████╗ ██╗██╗     ██████╗     ███████╗██████╗ ██╗
    ██╔══██╗██║██║     ██╔══██╗    ██╔════╝██╔══██╗██║
    ██████╔╝██║██║     ██║  ██║    █████╗  ██████╔╝██║
    ██╔══██╗██║██║     ██║  ██║    ██╔══╝  ██╔═══╝ ██║
    ██████╔╝██║███████╗██████╔╝    ███████╗██║     ██║
    ╚═════╝ ╚═╝╚══════╝╚═════╝     ╚══════╝╚═╝     ╚═╝`))
});