/*  Grupo A version 1.0
    Fecha de entrega: 6 de enero
*/
const express   = require('express'); 
const jwt       = require('jsonwebtoken'); // Para las sesiones - autenticacion
//const bcrypt    = require('bcrypt');       // PAra encriptar las claves
const unless    = require('express-unless'); // Para determinar que rutas vale el Middleware
const mysql     = require('mysql');
const util      = require('util');

const app       = express();
const port = process.env.PORT ? process.env.PORT : 3006; // puerto de la computadora (de mi servidor).

app.use(express.static("form"));
app.use(express.json());            // Permite el mapeo de la peticion json a objeto javascript.

app.use(express.urlencoded())       // Para cuando recibis info de un formulario.


// Conexion con mysql
const conexion = mysql.createConnection({
    host: 'localhost',
	user: 'root',
	password: '',
	database: 'biblioteca'
});

conexion.connect((error)=>{
    if(error) {
        throw error;
    }

    console.log('Conexion con la base de datos mysql establecida');
});


// Esta linea de codigo va inmediatamente despues de establecer la conexión mysql.
const qy = util.promisify(conexion.query).bind(conexion); // Permite el uso de asyn away en la conexión mysql.

const auth = (req, res, next) =>{  // Middlewade de autenticacion
    try{
        //Inicio del reconocimiento del token
        let token = req.headers['authorization'];
    
        if (!token){
            throw new Error("No estas logueado");
        }
    
        token = token.replace('Bearer ','');
    
        jwt.verify(token, 'Secret',(err, user)=>{
            /*if (err){
                res.status(401).send({error: "Token inválido"});
            }else{
                console.log("usuario valido", user);
                res.status(202).send({message:"usuario valido" });
    
            }*/
            if (err){
                console.log('token invalido');
                res.status(401).send({error: "Token inválido"});
            }  
        });

        next(); //Pasa el control a la funcion que se llamo en la peticion.-

    }catch(e){
        res.status(403).send({message: e.message});
    }
}

auth.unless = unless;

app.use(auth.unless({ //Se especifica para que rutas no funciona la autenticacion
    path: [
        {url: '/login', method: ['POST']}
    ]
}));


/************************* LOGIN ESTATICO SIN ENCRIPTACION **************************/
//(No hacemos login, al ser loguin estatico)
app.post('/login', (req, res) =>{

    try{
        if( !req.body.usuario || !req.body.clave ){
            res.status(401).send({error: "Falta usuario y clave"});
            return;
        }

        if (req.body.usuario == "grupoa" && req.body.clave == "1234"){
            const  tokenData = {
                alias: 'tp1_grupoa'
            }

            const token = jwt.sign(tokenData, 'Secret',{
                expiresIn: 60*60*24 //expira en 24hs.
            });

            res.send({token});
        }else{
            res.status(401).send({error:"Usuario y/o clave incorrectas"});
        }
   }catch(e){
        console.error(e.message);
       res.status(413).send({"mensaje": e.message + " error inesperado"});
    }
});



/*
var nodemailer = require('nodemailer');

;


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




/************************* METODOS PARA LIBROS ************************* */
// GET '/libro' - Listado de libros:
app.get('/libro', async (req, res)=>{
     try{
        let query       = "SELECT * FROM libros";
        let resultado    = await qy(query);
        res.status(200).send({"resultado": resultado });

    }catch(e){
        console.error(e.message);
        res.status(413).send({"mensaje": e.message + " error inesperado"});
    }

});
 
// GET '/libro/:id'  - Lectura de un libro especifico dada por su id
app.get('/libro/:id', async (req, res)=>{
    try{
        const query     = "SELECT * FROM libros WHERE id = ?";
        const result    = await qy(query, [req.params.id]);
        res.status(200).send({"resultado": result });
  
    }catch(e){
        console.error(e.message);
        res.status(413).send({"mensaje": e.message + " error inesperado, no se encuentra ese libro" });
    }
  
  });

// POST '/libro' - alta de un libro 
app.post('/libro', async(req, res)=>{
 
    try{ 
        if (!req.body.nombre || !req.body.descripcion || !req.body.categoria_id) { 
           throw new Error('Error, nombre, descripción y categoria son datos obligatorios');
        }

        let query = 'SELECT id FROM categorias WHERE id = ?  ';

        let respuesta = await qy(query, [req.body.categoria_id]);
        
        if (respuesta.length === 0) { //Valido que no exista una persona con ese nombre en la bd.
            throw new Error('Error, no existe la categoria indicada.');
        }
     
        
        let persona = null;
        if (req.body.persona_id){
            persona = req.body.persona_id;
        }

        //Si pasan las validaciones, guardo la persona:
        query = 'INSERT INTO libros(nombre, descripcion, categoria_id, persona_id) VALUES(?,?,?,?) ';
        respuesta = await qy(query,[req.body.nombre.toUpperCase(), req.body.descripcion.toUpperCase(), req.body.categoria_id, persona]);
        
       
        res.status(200).send({"resultado": respuesta });

    }catch(e){
        console.error(e.message);
        res.status(413).send({mensaje: e.message +  "error inesperado"});
      
    }
   

});


app.put('/libro/:id', async(req, res)=>{

    
    try{
        if (!req.body.nombre) { //Valido que exista este parametro nombre.
            throw new Error('Error, falta el nombre del libro');
        }

        if (!req.body.descripcion) { //Valido que exista este parametro nombre.
            throw new Error('Error, falta la descripcion del libro');
        }

        if (!req.body.categoria_id) { //Valido que exista este parametro nombre.
            throw new Error('Error, falta la categoria del libro');
        }

        let query = 'SELECT id FROM libros WHERE nombre = ? AND id != ? ';

        let respuesta = await qy(query,[req.body.nombre, req.params.id]);
        
        if (respuesta.length > 0) { //Valido que no exista un libro con ese nombre en la bd.
                throw new Error('Error, ya existe otro libro con el mismo nombre en la base de datos.');
        }
      
        query = 'SELECT id FROM libros WHERE descripcion = ? AND id != ? ';

        respuesta = await qy(query,[req.body.descripcion, req.params.id]);
        
        if (respuesta.length > 0) { //Valido que no exista un libro con esa descripcion en la bd.
                throw new Error('Error, ya existe otro libro con la misma descripción en la base de datos.');
        }

      
        let persona = null;
        if (req.body.persona_id){
            persona = req.body.persona_id;
        }

       //Si pasan las validaciones, modifico el libro:
       query = 'UPDATE libros SET nombre = ?, descripcion = ?, categoria_id = ?, persona_id = ? WHERE id = ? ';
       respuesta = await  qy(query,[req.body.nombre.toUpperCase(), req.body.descripcion.toUpperCase(), req.body.categoria_id, persona, req.params.id]);
    
      
       res.status(200).send({"resultado": respuesta });


    }catch(e){
        console.error(e.message);
        res.status(413).send({mensaje: e.message +  "error inesperado"});
    }
   

});



app.listen(port, () => {

    console.log('escuchando fuerte y claro en el puerto', port);

});
