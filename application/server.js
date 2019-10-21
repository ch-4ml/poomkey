// Import modules
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
// const cors = require('cors');
// app.use(cors());
// Template Engine
app.set('view engine', 'ejs');
// Template File Location

// Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

// Router
const router = require('./router/router');
app.use(router);

app.get('/', (req, res) => {
    let data; 
    data = { user: req.session.user };
    res.render('index', { data: data });
});

// Server initialize
app.listen(8080, function() {
    console.log("Run server");
});