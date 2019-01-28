'use strict';

const express = require('express');
const app = express();
const path = require('path');
const user = require('./routes/user').user;
const browser = require('./routes/browser');
const bodyParser = require('body-parser');
const cors = require('cors');
const favicon = require('serve-favicon');
const _public = require('./config').public;

//Configuring CORS
const whitelist = [];
const corsOptions = {
    origin(origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(cors());
app.options('*', cors(corsOptions)) // include before other routes

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(err, req, res, next) {
    console.error(err.stack);
});

app.use(user);
app.use('/api', browser);

app.use(express.static(path.join(__dirname, _public)));
app.use(
    favicon(
        path.join(__dirname, _public, './favicon.ico')
    )
);
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, _public, './index.html')
    );
});
app.get('/login', (req, res) => {
    res.sendFile(
        path.join(__dirname, _public, './index.html')
    );
});
app.get('/admin', (req, res) => {
    res.sendFile(
        path.join(__dirname, _public, './index.html')
    );
});
app.get('/empty', (req, res) => {
    res.sendFile(
        path.join(__dirname, _public, './index.html')
    );
});

const port = process.env.PORT || 4000;

app.listen(port, function() {
    console.log('Server listening on port ' + port)
});