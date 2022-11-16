const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json());

const MONGODB_URI = 'mongodb://localhost:27017/messages?retryWrites=true&w=majority';

// CORS Headers - Cross-Origin Resource Sharing 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE'); //OPTIONS is optional :"
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

// app.listen(8080);
mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(8080);
        console.log('connected');
    })
    .catch(err => {
        console.log(err);
    });