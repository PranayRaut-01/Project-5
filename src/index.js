const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const mongoose = require('mongoose');
const app = express();
const multer = require("multer")
const { AppConfig } = require('aws-sdk');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

///////////////// [ MONGO-DB CONNECTION ] /////////////////
mongoose.connect("mongodb+srv://PranayR24:LNs6IH7mT8iLlT4b@pranaycluster.2bkjp.mongodb.net/Project5Group42", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

///////////////// [ ROOT API ] /////////////////
app.use('/', route)

///////////////// [ SERVER CONNECTION ] /////////////////
app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});