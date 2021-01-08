var express = require('express');
var router = express.Router();

// Load the MySQL pool connection
const pool = require('../app.js');

/* Display all users
router.get('/libro', (request, response) => {
  pool.query('SELECT * FROM libros', (error, result) => {
      if (error) throw error;

      response.status(200).send(result, "Error inesperado");
  });
});
*/
router.get('/libro', async (req, res) => {

  try {

    const connection = await pool.createConnection();

    try {
      const sql = "SELECT * FROM libros ";
      const flags = await connection.query(sql);

      if (flags.length === 0)
        return res.status(413).send({ message: 'Error inesperado' });

      return res.status(200).send({"resultado":flags});

    } finally {
      pool.releaseConnection(connection);
    }

  } catch (e) {
    console.error(e.message);
    res.status(413).send({"Error": e.message});
  }
});


module.exports = router;

//GET '/libro' devuelve 200 y [{id: numero, nombre:string, descripcion:string, categoria_id:numero, persona_id:numero/null}] o bien 413, {mensaje: <descripcion del error>} "error inesperado"
/*router.get('/libro', async (req, res)=>{

 
  try{
      const query     = "SELECT * FROM libros";
      const result    = await qy(query);
      res.status(200).send({"resultado": result });

  }catch(e){
      console.error(e.message);
      res.status(413).send({"Error": e.message});
  }

});*/

