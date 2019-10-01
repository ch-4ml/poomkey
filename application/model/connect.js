const mysql = require('mysql2/promise');
const config = {
    host : 'localhost',
    user : 'ch-4ml',
    password : 'knifeark7677',
    database : 'poomkey',
    dateStrings: 'date'
};

const pool = mysql.createPool(config);
module.exports = pool;