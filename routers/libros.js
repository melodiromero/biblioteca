var express = require('express');
var router = express.Router();

//GET '/libro' devuelve 200 y [{id: numero, nombre:string, descripcion:string, categoria_id:numero, persona_id:numero/null}] o bien 413, {mensaje: <descripcion del error>} "error inesperado"

router.get('/libro', async (req, res)=>{
 
  try{
      const query     = "SELECT * FROM libros";
      const result    = await qy(query);
      res.status(200).send({"resultado": result });

  }catch(e){
      console.error(e.message);
      res.status(413).send({"Error": e.message});
  }

});

module.exports = router;
