const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const {graphqlHTTP} = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/messages?retryWrites=true&w=majority';
const port = process.env.PORT || 8080;

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = 'images';
        if (!fs.existsSync(path)) fs.mkdir(path, err => {console.log(err)});
        cb(null, path);
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
            cb(null, true); //accept the file
            break;
        default:
            cb(null, false); //reject the file
    }
};

app.use(bodyParser.json());
app.use(multer({
    storage: fileStorage,
    fileFilter
}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// CORS Headers - Cross-Origin Resource Sharing 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE'); //OPTIONS is optional :"
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //Authorization must be enabled
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: 'File stored.', filePath: req.file.path });
});

app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err) {
            if (!err.originalError) {
                return err;
            }
            const data = err.originalError.data;
            const message = err.message || 'An error occurred.';
            const code = err.originalError.code || 500;
            return {
                message: message,
                status: code,
                data: data
            };
        }
    })
);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500; //setting default value of 500
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data
    });

});

// app.listen(8080);
mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(port);
        console.log('Server is connected on port: ' + port);
    })
    .catch(err => {
        console.log(err);
    });