//TP grupal version 0.1
// Fecha de entrega: 6 de enero
"use strict"
var express = require('express');
var app = express();
//mail
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



app.listen(3000, function() {
    console.log('escuchando fuerte y claro en el puerto 3000!');
    });