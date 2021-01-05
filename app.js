//TP grupal version 0.1
// Fecha de entrega: 6 de enero
'use strict'

const express   = require('express'); 
const mysql     = require('mysql');
const util      = require('util');

var categoriasRuta  = require('./routers/categorias');
var personasRuta    = require('./routers/personas');
var librosRuta      = require('./routers/libros');

var app         = express();
const port      = 3000;

/** Primer nivel ruteo */
app.use('/categorias', categoriasRuta);
app.use('/personas', personasRuta);
app.use('/libros', librosRuta);


// *** Conexion con la BD
const conexion  = mysql.createConnection({
    host:       'localhost',
    user:       'root',
    password :  '',
    database :  'biblioteca'
});

conexion.connect((error)=> {
    if(error){
        throw error;
    }

    console.log('La conexión de mysql se ha establecido');
});
// Esta linea de codigo va inmediatamente despues de establecer la conexión mysql.
const qy = util.promisify(conexion.query).bind(conexion); // Permite el uso de asyn away en la conexión mysql.


/*mail
var nodemailer = require('nodemailer');

app.use(express.static("form"));
app.use(express.urlencoded());


app.post("/form", function(req, res) {
    var html = "Hola " +req.body.nombre + " " +req.body.apellido + " vives en " +req.body.paisresidencia + ".<br>" + '<button onclick=window.location.href="/form.html">Probar de nuevo</button>';
    res.send(html);
});

//opciones de mail
var mensaje = "Hola desde nodejs!"
var mailOptions = {
    from: "remitente",
    to: "destinatario",
    subject: "testing",
    text: mensaje,
};

//enviar mail
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mail",
        pass: "pass",
    }
});

transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        console.log(error);
    }
    else {
        console.log("Email enviado: " + info.response);
    
    }
    
});

*/

app.listen(port, function() {
    console.log('escuchando fuerte y claro en el puerto ');
    });


module.exports = app;