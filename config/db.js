const mysql = require ('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'whatsappbot'
})

connection.connect(function (err){
    if (err) {
        console.log("Database not connected");
    } else{
        console.log("Connect with database success");
    }
})
module.exports=connection