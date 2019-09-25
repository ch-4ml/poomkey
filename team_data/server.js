// Import modules
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
// app.use(cors());
// Template Engine
app.set('view engine', 'ejs');
// Template File Location
app.set('/', __dirname + '/views');

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(express.static('views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

// Router
const router = require('./router/router');
app.use(router);

app.get('/', (req, res) => {
    res.render('/index.html');
});

// Server initialize
app.listen(8080, function() {
    console.log("Run server");
});