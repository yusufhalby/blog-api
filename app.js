const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');


const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '.') + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    switch (file.mimetype) {
        case 'image/png':
        case 'image/jpg':
        case 'image/jpeg':
            cb(null, true);     //accept the file
            break;
        default:
            cb(null, false);    //reject the file
    }
};  

app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

const MONGODB_URI = 'mongodb://127.0.0.1:27017/messages?retryWrites=true&w=majority';

// CORS Headers - Cross-Origin Resource Sharing 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE'); //OPTIONS is optional :"
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //Authorization must be enabled
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next)=>{
    console.log(error);
    const status = error.statusCode || 500; //setting default value of 500
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data});

});

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