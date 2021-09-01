const jwt = require('jsonwebtoken');
const http = require('http'); 
const express = require('express'); 
const app = express(); 
const PORT = process.env.PORT || 5000
const db = require("./db");
 
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const salt = 'salt88'

// Add headers before the routes are defined
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,token');

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

app.get('/saldo', verifyJWT, saldo);

async function saldo(req, res, next){ 
  try {
    console.log('called saldo')
    var idUsuario = req.query.idUsuario;
    const [saldo] = await db.selectSaldo(idUsuario);
    res.json(saldo);
  } catch (error) {
    res.status(500);
    res.json(error);
  }
} 

function hashMRP(pwd){
  var crypto = require('crypto');
  var hash = crypto.createHash('sha256').update(salt+pwd).digest('base64');
  return hash
}

 
app.get('/redes', redes);

async function redes(req, res){ 
  try {
    //const redes = [{id:1, nome:'Principal'},{id:2, nome:'Orc Sorridente'}]  
    console.log('called redes')
    const [redes] = await db.selectRede();
    res.json(redes);
  } catch (error) {
    res.status(500);
    res.json(error);
  }
}


app.get('/genesis', genesis);

async function genesis(req, res){ 
  try {
    var idRede = req.query.idRede; 

    const [genesis] = await db.selectGenesis(idRede);
    res.json(genesis);
  } catch (error) {
    res.status(500);
    res.json(error);
  }
} 

app.post('/login', login);

async function login(req, res, next){ 
  try { 
    //console.log(req.body.email, req.body.password, req.body.idRede)

    const hashedPWD = hashMRP(req.body.password)

    //console.log(hashedPWD)

    const [result] = await db.selectLogin(req.body.email, hashedPWD, req.body.idRede);
    const idUsuario = result[0].idUsuario
    if( idUsuario > 0 ){
      const token = jwt.sign({ idUsuario }, process.env.SECRET, {
        expiresIn: 30000 
      }); 
      return res.json({ auth: true, token: token, idUsuario: idUsuario});
    }else{ //esse else n ta funfando 
      res.status(401);
      return res.json("Login inválido.");
    }
  } catch (error) {
    res.status(500);
    console.log(error)
    return res.json(error);
  }
} 


app.post('/transacao',  verifyJWT, transacao);

//falta verificar se o token foi gerado pelo usuario mesmo
async function transacao(req, res, next){ 
  try { 
    console.log(req.body.idRede,req.body.idUsuarioOrigem,req.body.idUsuarioDestino,req.body.valor,req.body.mensagem, req.body.emailDestino)
    var idUsuarioDestino= req.body.idUsuarioDestino
    const idRede = req.body.idRede
    const idUsuarioOrigem = req.body.idUsuarioOrigem    
    const valor= req.body.valor
    const mensagem = req.body.mensagem
    const emailDestino = req.body.emailDestino


    if(typeof idUsuarioDestino === 'undefined' && typeof emailDestino !== 'undefined'){
      const [ret] = await db.getIdUsuarioDestino(idRede, emailDestino)
      idUsuarioDestino = ret[0].idUsuario
    }
    
    const [sqlExec] = await db.insertTransaction(idRede,
    idUsuarioOrigem,
    idUsuarioDestino,
    valor,
    mensagem);

    const result = sqlExec[1][0].result

    if(result === 1 ){
      res.status(200);
      return res.json("Transacao efetuada");
    }else if(result === -1){
      res.status(401);
      return res.json("Transacao NAO FOI efetuada. Valor invalido.");
    }else if(result === -2){
      res.status(401);
      return res.json("Transacao NAO FOI efetuada. SEM SALDO.");
    }
   
  } catch (error) {
    res.status(500);
    console.log(error)
    return res.json(error);
  }
} 

app.post('/logout', function(req, res) {
    res.json({ auth: false, token: null });
})


function verifyJWT(req, res, next){

    const token = req.headers['token'];

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

