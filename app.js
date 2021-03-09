/*  Grupo A version 1.0
    Fecha de entrega: 6 de enero
*/
const express   = require('express'); 
const jwt       = require('jsonwebtoken'); // Para las sesiones - autenticacion
//const bcrypt    = require('bcrypt');       // PAra encriptar las claves
const unless    = require('express-unless'); // Para determinar que rutas vale el Middleware
const mysql     = require('mysql');
const util      = require('util');
const cors      = require('cors');
const app       = express();
const port = process.env.PORT ? process.env.PORT : 3016; // puerto de la computadora (de mi servidor).

app.use(express.static("form"));
app.use(express.json());            // Permite el mapeo de la peticion json a objeto javascript.
app.use(cors({origin: "http://localhost:3016"}));
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


/************************* METODOS PARA CATEGORIAS ************************* */
//  POST '/categoria' - ALTA DE UNA CATEGORIA
/*  Requerimiento: POST '/categoria' recibe: {nombre: string} retorna: status: 200, 
{id: numerico, nombre: string} - status: 413, {mensaje: <descripcion del error>} que puede ser:
 "faltan datos", "ese nombre de categoria ya existe", "error inesperado" '/
*/
app.post("/categoria", async (req, res) =>{

    try {
        //VALIDO QUE MANDEN CORRECTA INFO
        if(!req.body.nombre){
            throw new Error ("Falta enviar el nombre")
        };

        const nombre = req.body.nombre;
        //VERIFICO QUE NO HAYA DOS IGUALES

        let query = "SELECT id FROM categorias WHERE nombre = ?";

        let respuesta = await qy(query, [nombre]);

        if (respuesta.length > 0) {
            throw new Error ("Ese nombre de categoria ya existe");
        };

        //GUARDO NUEVA CATEGORIA
        query = "INSERT INTO categorias (nombre) VALUE (?)";
        respuesta = await qy(query, [nombre.toUpperCase()]);
        console.log(respuesta);
        res.status(200).send({"respuesta":respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});

//  GET '/categoria' - LECTURA DE TODAS LAS CATEGORIAS
/*  Requerimiento: GET '/categoria' retorna: status 200  
    y [{id:numerico, nombre:string}]  - status: 413 y []
*/
app.get("/categoria", async (req, res) => {
    try {
        const query = "SELECT * FROM categorias";
        const respuesta = await qy(query);
        res.status(200).send({"respuesta" : respuesta});
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"mensaje": e.message});
    }
});


//  GET '/categoria/:id' - LECTURA DE UNA CATEGORIAS ESPECIFICA
/*  Requerimiento: GET '/categoria' retorna: status 200  
    y [{id:numerico, nombre:string}]  - status: 413 y []
*/
app.get("/categoria/:id", async (req, res) =>{

    try {
        if(!req.params.id){
            throw new Error ("Falta enviar la categoria")
        };

        const query = "SELECT * FROM categorias WHERE id = ?";
        const respuesta = await qy(query, [req.params.id]);
        
        if (respuesta.length === 0) {
            throw new Error ("La categoria no existe")
        };

        console.log(respuesta);
        res.status(200).send({"respuesta": respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});

//  DELETE '/categoria/:id' - LECTURA DE TODAS LAS CATEGORIAS
/*  Requerimiento: GET '/categoria' retorna: status 200  
    y [{id:numerico, nombre:string}]  - status: 413 y []
*/
app.delete("/categoria/:id", async (req, res) => {

    try {

        if(!req.params.id){
            throw new Error ("Falta enviar la categoria")
        };

        let query = "SELECT * FROM categorias WHERE id = ?";
        let respuesta = await qy(query, [req.params.id]);
        
        if (respuesta.length === 0) {
            throw new Error ("La categoria a borrar no existe")
        };

        query = "SELECT * FROM libros WHERE categoria_id = ?"
        respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw new Error ("Esta categoria tiene libros asociados, no se puede borrar")
        };

        query = "DELETE FROM categorias WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);
        res.status(200).send({"respuesta": respuesta});

    }

catch(e) {

    console.error(e.message);
    res.status(413).send({"mensaje": e.message});
}

});


/************************* METODOS PARA PERSONAS ************************* */
//  POST '/persona' - ALTA DE UNA PERSONA
/*  Requerimiento: POST '/persona' recibe: {nombre: string, apellido: string, alias: string, email: string} 
    retorna: status: 200, {id: numerico, nombre: string, apellido: string, alias: string, email: string} 
    - status: 413, {mensaje: <descripcion del error>} que puede ser: "faltan datos",
    "el email ya se encuentra registrado", "error inesperado" /
*/

app.post('/persona', async (req, res)=> {

    const nombre    = req.body.nombre;
    const apellido  = req.body.apellido;
    const alias     = req.body.alias;
    const email     = req.body.email;

try{
    if(!nombre || !apellido || !alias || !email) { //Validación de datos
        throw new Error('Faltan datos. Por favor, completa todos los campos')
    } //redirección al catch

    //Verificacion de mail
    let query     = 'Select id FROM personas WHERE email = ?';
    let result    = await qy(query, email);
    if(result.length > 0) {
        throw new Error('El mail ingresado ya se encuentra registrado')
    }

    //Registro de datos
    query     = 'INSERT INTO personas(nombre, apellido,email,alias) VALUES(?,?,?,?)';
    result    = await qy(query,[nombre.toUpperCase(), apellido.toUpperCase(), email.toUpperCase(), alias.toUpperCase()]);
    res.status(200).send({'resultado': result });
    console.log(respuesta);

}catch(e){
    console.error(e.message);
    res.status(413).send({'mensaje': e.message});
}  
});

//  GET '/persona' - LECTURA DE TODAS LAS PERSONAS
/*  Requerimiento: GET '/persona' retorna status 200 y [{id: numerico, nombre: string, 
    apellido: string, alias: string, email; string}] o bien status 413 y []
*/
app.get('/persona', async (req, res)=> {

    try{
        let query     = 'SELECT * FROM personas';
        let result    = await qy(query);
        res.status(200).send({'resultado': result });
    
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({'mensaje': e.message});
    }
    });
    
//  GET '/persona/:id' - LECTURA DE UNA PERSONA ESPECIFICA
/*  Requerimiento: GET '/persona/:id' retorna status 200 y {id: numerico, nombre: string, 
    apellido: string, alias: string, email; string} - status 413 , {mensaje: <descripcion del error>}
    "error inesperado", "no se encuentra esa persona"
*/
app.get('/persona/:id', async (req, res)=> {
    
    try{
        if (!req.params.id) { //Valido que exista este parametro nombre.
            throw new Error('Error, falta la persona');
        }
        let query     = 'SELECT * FROM personas WHERE id = ?';
        let result    = await qy(query,[req.params.id]);

        if (result.length === 0) { //Valido que exista la persona con ese id en la bd.
            throw new Error('Error, no se encuentra esa persona');
        }else{
            res.status(200).send({'resultado': result });
        }

        
    }
    
    catch(e){
        console.error(e.message);
        res.status(413).send({'mensaje': e.message});
        console.log(error)
    
    }
});

//  PUT '/persona/:id' - LECTURA DE UNA PERSONA ESPECIFICA
/*  Requerimiento: PUT '/persona/:id' recibe: {nombre: string, apellido: string, alias: string, 
    email: string} el email no se puede modificar. retorna status 200 y el objeto modificado o 
    bien status 413, {mensaje: <descripcion del error>} "error inesperado", "no se encuentra esa persona"
*/
app.put('/persona/:id', async (req, res)=> {
    const nombre    = req.body.nombre;
    const apellido  = req.body.apellido;
    const alias     = req.body.alias;
    const email     = req.body.email;

    try{
        if(!req.params.id) {
            throw new Error ('no se encuentra esta persona');
        }

        if(email) {
                throw new Error ('No puedes modificar el email')
        }

        let query = 'SELECT * FROM personas WHERE id = ?';
        let result = await qy(query, [req.params.id]);
        if (result.length === 0) { //Valido que exista la persona con ese id en la bd.
            throw new Error('Error, no se encuentra esa persona');
        }

        query = 'UPDATE personas SET nombre=?, apellido =?, alias =? WHERE id = ?'
        result = await qy(query, [nombre.toUpperCase(), apellido.toUpperCase(), alias.toUpperCase(), req.params.id]);
        res.status(200).send({'Resultado': result});
    
    }
    
    catch(e){
        console.error(e.message);
        res.status(413).send({'mensaje':e.message})
        console.log('error inesperado')
    
    }
    });

//  DELETE '/persona/:id' - BAJA DE UNA PERSONA ESPECIFICA
/*  Requerimiento: DELETE '/persona/:id' retorna: 200 y {mensaje: "se borro correctamente"} 
    o bien 413, {mensaje: <descripcion del error>} "error inesperado", "no existe esa persona", 
    "esa persona tiene libros asociados, no se puede eliminar"
*/
app.delete('/persona/:id', async (req, res)=> {
    try{

        if(!req.params.id) {
            throw new Error ('no se encuentra esta persona');
        }

        let query = 'SELECT * FROM personas WHERE id = ?';
        let result = await qy(query, [req.params.id]);
        if (result.length === 0) { //Valido que exista la persona con ese id en la bd.
            throw new Error('Error, no existe esa persona');
        }

        query = 'SELECT * FROM libros WHERE persona_id = ?';
        result = await qy(query, [req.params.id]);

        if(result.length > 0) {
            throw new Error('Esa persona tiene libros asociados. No se puede borrar');
        }
        
        query = 'DELETE FROM personas WHERE id = ?';
        result = await qy(query, [req.params.id]);
        res.status(200).send({'Resultado': result.affectedRows + " se borro correctamente"});
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({'mensaje':e.message});
        console.log('error inesperado');
    }
 });

/************************* METODOS PARA LIBROS ************************* */
//  POST '/libro' - ALTA DE UN LIBRO
/*  Requerimiento: POST '/libro' recibe: {nombre:string, descripcion:string, categoria_id:numero, 
    persona_id:numero/null} devuelve 200 y {id: numero, nombre:string, descripcion:string, 
    categoria_id:numero, persona_id:numero/null} o bien status 413,  {mensaje: <descripcion del error>} 
    que puede ser "error inesperado", "ese libro ya existe", "nombre y categoria son datos obligatorios",
     "no existe la categoria indicada", "no existe la persona indicada"
*/
app.post('/libro', async(req, res)=>{
 
    try{ 
        if (!req.body.nombre || !req.body.descripcion || !req.body.categoria_id) { 
           throw new Error('Error, nombre, descripción y categoria son datos obligatorios');
        }

        let query = 'SELECT id FROM categorias WHERE id = ?  ';

        let respuesta = await qy(query, [req.body.categoria_id]);
        
        if (respuesta.length === 0) { //Valido que no exista una categoria con ese id en la bd.
            throw new Error('Error, no existe la categoria indicada.');
        }
     
        
        let persona = null;
        if (req.body.persona_id){ // Si el usuario ingresa la persona, se valida que la misma exista en la bd.
            
            query = 'SELECT id FROM personas WHERE id = ?  ';

            respuesta = await qy(query, [req.body.persona_id]);
            
            if (respuesta.length === 0) { //Valido que no exista una persona con ese id en la bd.
                throw new Error('Error, no existe la persona indicada.');
            }else{
                 
                persona = req.body.persona_id;
            }
            
           
        }

        //Si pasan las validaciones, guardo la persona:
        query = 'INSERT INTO libros(nombre, descripcion, categoria_id, persona_id) VALUES(?,?,?,?) ';
        respuesta = await qy(query,[req.body.nombre.toUpperCase(), req.body.descripcion.toUpperCase(), req.body.categoria_id, persona]);
        
       
        res.status(200).send({"respuesta": respuesta });

    }catch(e){
        console.error(e.message);
        res.status(413).send({"mensaje": e.message +  "error inesperado"});
      
    }
   

});


//  GET '/libro' - LISTADO DE LIBROS:
/*  Requerimiento: GET '/libro' devuelve 200 y [{id: numero, nombre:string, descripcion:string,
    categoria_id:numero, persona_id:numero/null}] o bien 413, {mensaje: <descripcion del error>} 
    "error inesperado"
*/
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
 
// GET '/libro/:id'  - LECTURA DE UN LIBRO ESPECIFICO DADA POR SU ID
/*  Requerimiento: GET '/libro/:id' devuelve 200 {id: numero, nombre:string, descripcion:string, 
    categoria_id:numero, persona_id:numero/null} y status 413, {mensaje: <descripcion del error>} 
    "error inesperado", "no se encuentra ese libro"
*/
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

// PUT '/libro/:id' - MODIFICACION DE UN LIBRO
/*  Requerimiento: PUT '/libro/:id' y {id: numero, nombre:string, descripcion:string, categoria_id:numero,
    persona_id:numero/null} devuelve status 200 y {id: numero, nombre:string, descripcion:string, 
    categoria_id:numero, persona_id:numero/null} modificado o bien status 413, 
    {mensaje: <descripcion del error>} "error inesperado",  "solo se puede modificar la descripcion del libro
*/
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
        if (req.body.persona_id){ // Si el usuario ingresa la persona, se valida que la misma exista en la bd.
            
            query = 'SELECT id FROM personas WHERE id = ?  ';

            respuesta = await qy(query, [req.body.persona_id]);
            
            if (respuesta.length === 0) { //Valido que no exista una persona con ese id en la bd.
                throw new Error('Error, no existe la persona indicada.');
            }else{
                 
                persona = req.body.persona_id;
            }
            
           
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

// PUT '/libro/prestar/:id' - PRESTAMO DE UN LIBRO
/*  Requerimiento: PUT '/libro/prestar/:id' y {id:numero, persona_id:numero} devuelve 200 
    y {mensaje: "se presto correctamente"} o bien status 413, {mensaje: <descripcion del error>} 
    "error inesperado", "el libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva",
     "no se encontro el libro", "no se encontro la persona a la que se quiere prestar el libro"
*/
app.put( "/libro/prestar/:id", async (req,res) =>{
    try{
        //Se valida que exista el usuario ingrese ambos parametros.
      if (!req.params.id ){
        throw new Error( "Debe ingresar el libro a prestar");
      }

      if (!req.body.persona_id){
        throw new Error( "Debe ingresar la persona a quien prestar el libro");
      }
  
      //Se valida que exista el usuario y la persona en la bd.
      let query = "SELECT * FROM libros WHERE id = ?";
      let result = await qy(query, [req.params.id]);
      if (result.length === 0){
        throw new Error ( "No se encontro el libro");
      } 

      query = "SELECT * FROM personas WHERE id= ?";
      result = await qy(query, [req.body.persona_id]);
    
      if (result.length === 0) {
        throw new Error("No se encontro la persona a la que se quiere prestar el libro");
      }

      // Se consulta si el libro no se encuentra prestado a otra persona.
      query = "SELECT * FROM libros WHERE id = ? AND persona_id != ?";
      result = await qy(query, [req.params.id, req.body.persona_id]);
      if (result.length > 0){
        throw new Error ( "El libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva")
      } 
      
       // Se consulta si el libro no se encuentra prestado a otra persona.
       query = "SELECT * FROM libros WHERE id = ? AND persona_id = ?";
       result = await qy(query, [req.params.id, req.body.persona_id]);
       if (result.length > 0){
         throw new Error ( "El libro ya se encuentra prestado a la persona ingresada")
       } 

      query = "UPDATE libros SET persona_id = ? WHERE id = ?"
      result = await qy(query, [req.body.persona_id, req.params.id]);
      
      res.status(200).send({"respuesta": result.affectedRows + " Se presto correctamente"});
  
  
  }
    catch(e){
      console.error(e.message);
      res.status(413).send({"Error": e.message});
  }
  
  });

// PUT '/libro/devolver/:id' - DEVOLUCION DE UN LIBRO
/*  Requerimiento: '/libro/devolver/:id' y {} devuelve 200 y
    {mensaje: "se realizo la devolucion correctamente"} o bien status 413, 
    {mensaje: <descripcion del error>} "error inesperado", 
    "ese libro no estaba prestado!", "ese libro no existe"
 */
app.put( "/libro/devolver/:id", async (req,res) =>{
    try{
      if (!req.params.id){ //Valido que ingrese el libro
        throw new Error( "Debe ingresar el libro a devolver")
      }
  
      let query  = "SELECT * FROM libros WHERE id= ?";
      let result = await qy(query, [req.params.id]);
    
      if (result.length === 0) { //Consulto si existe en la BD
        throw new Error("Ese libro no existe");
      }

      query  = "SELECT * FROM libros WHERE id= ? AND persona_id = NULL ";
      result = await qy(query, [req.params.id]);
    
      if (result.length > 0) {
        throw new Error("Ese libro no estaba prestado!");
      }

      query = "UPDATE libros SET persona_id = NULL WHERE id = ?"
      result    = await qy(query, [req.params.id]);
      
      res.send({"mensaje": result.affectedRows +" se realizo la devolucion correctamente"});
  
  
  }
    catch(e){
      console.error(e.message);
      res.status(413).send({"Error": e.message});
  }
  
 });
  
// DELETE '/libro/:id' - BAJA DE UN LIBRO
/*  Requerimiento: DELETE '/libro/:id' devuelve 200 y {mensaje: "se borro correctamente"} 
    o bien status 413, {mensaje: <descripcion del error>} "error inesperado", "no se encuentra ese libro",
     "ese libro esta prestado no se puede borrar"
 */
app.delete( "/libro/:id", async (req,res) =>{
    try{
        let query  = "SELECT * FROM libros WHERE id= ?";
        let result = await qy(query, [req.params.id]);
      
        if (result.length === 0) { //Consulto si existe en la BD
          throw new Error("No se encuentra ese libro");
        }

        query = "SELECT * FROM libros WHERE persona_id != NULL AND id= ?";
        result = await qy(query, [req.params.id]);
          if (result.length > 0) {
            throw new Error ( "Ese libro esta prestado no se puede borrar")
        }

        query = "DELETE FROM libros WHERE id= ?";
         
        result = await qy(query, [req.params.id]);
        res.status(200).send({"mensaje": result.affectedRows + " se borro correctamente"});
    
  }
    catch(e){
      console.error(e.message);
      res.status(413).send({"Error": e.message});
  }
  
  });
  






app.listen(port, () => {

    console.log('escuchando fuerte y claro en el puerto', port);

});
