const jwt = require('jsonwebtoken');
const http = require('http'); 
const express = require('express'); 
const app = express(); 
const PORT = process.env.PORT || 5000
const db = require("./db");
 
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Add headers before the routes are defined
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware

  //console.log("WTFFFF"  )
  next();
});
 
app.get('/', (req, res, next) => {
    res.json({message: "mrp server is up"});
})
 
/* app.get('/clientes', verifyJWT, (req, res, next) => { 
    console.log("Retornou todos clientes!");
    res.json([{id:1,nome:'luiz'}]);
})  */

app.get('/redes', redes);

async function redes(req, res){ 
  try {
    //const redes = [{id:1, nome:'Principal'},{id:2, nome:'Orc Sorridente'}]  
    const [redes] = await db.selectRede();
    res.json(redes);
  } catch (error) {
    res.status(500)
  }
} 



//authentication
app.post('/login', (req, res, next) => {
    //esse teste abaixo deve ser feito no seu banco de dados
    if(req.body.user === 'luiz' && req.body.password === '123'){
      const id = 1; //esse id viria do banco de dados
      const token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 300 // 
      });
      console.log("login ok");
      return res.json({ auth: true, token: token });
    }

    console.log("login NOT ok");
    
    res.status(500).json({message: 'Login inválido!'});

})

/* transferirPontos(redeId,contaOrigem,contaDestino, pontos)  
 
app.get('/transferirPontos', verifyJWT, (req, res, next) => { 
    req.body.user
    res.json([{id:1,nome:'luiz'}]);
}) */


app.post('/logout', function(req, res) {
    res.json({ auth: false, token: null });
})


function verifyJWT(req, res, next){
    const token = req.headers['token'];
    console.log(token)
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      req.userId = decoded.id;
      next();
    });

}

 
const server = http.createServer(app); 
server.listen(PORT);
console.log("Servidor startou porta:" + PORT)

