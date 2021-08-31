
async function connect(){
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection(process.env.CLEARDB_DATABASE_URL.replace('?reconnect=true', '')+
    "?multipleStatements=true");
    return connection;
}


async function selectRede(){
    const conn = await connect();
    const rows = conn.query('select id_rede, nome from rede');
    //console.log(rows)
    const ret = await rows;
    conn.end;
    return ret;
} 

async function selectSaldo(id_usuario){
    const conn = await connect();
    sql = `select saldo, r.sigla_ponto
    from usuario u, rede r 
    where id_usuario = ?
    and r.id_rede = u.id_rede
    `
    const rows = conn.query(sql, [id_usuario]);
    //console.log(rows)
    const ret = await rows;
    conn.end;
    return ret;
} 

async function selectLogin(conta, password, idRede){
    const conn = await connect();
    const sql = 'select id_usuario from usuario where conta = ? and password = ? and id_rede = ? ';

    const ret = await conn.query(sql, [conta, password, idRede]) 
    conn.end;
    return ret;

} 


async function selectGenesis(idRede){
    const conn = await connect();

    const sql = `select t.valor, uo.conta, ud.conta, t.data, t.mensagem 
    from transacao t, usuario uo, usuario ud
    where t.id_usuario_orig = uo.id_usuario
    and t.id_usuario_dest = ud.id_usuario 
    and uo.tipo = 0
    and t.id_rede = ? 
    order by t.data desc  `

    const ret = await conn.query(sql, [idRede]) 
    conn.end;
    return ret;

} 

async function insertTransaction(idRede, idUsuarioOrigem, idUsuarioDestino, valor, mensagem){
    const conn = await connect();
    const sql = "CALL transacao(?,?,?,?,?, @result); select @result as result";
    const sqlExec = conn.query(sql, [idRede, idUsuarioOrigem, idUsuarioDestino, valor, mensagem],function(err,rows){
        if(err) throw err;
        console.log(rows);
    });

    const ret = await sqlExec
    conn.end;
    return ret;

} 



module.exports ={selectRede, selectLogin, insertTransaction, selectSaldo, selectGenesis}