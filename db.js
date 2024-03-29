async function connect(){
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection(process.env.CLEARDB_DATABASE_URL.replace('?reconnect=true', '')+
    "?multipleStatements=true");
    return connection;
}

async function selectRede(){
    const conn = await connect();
    const rows = conn.query('select id_rede as idRede, nome from rede');
    //console.log(rows)
    const ret = await rows;
    conn.end()
    return ret;
} 

async function selectSaldo(idUsuario){
    const conn = await connect();
    sql = `select saldo, r.sigla_ponto as siglaPonto, u.nome, u.email
    from usuario u, rede r 
    where id_usuario = ?
    and r.id_rede = u.id_rede
    `
    const rows = conn.query(sql, [idUsuario]);
    //console.log(rows)
    const ret = await rows;
    conn.end()
    return ret;
} 

async function selectLogin(email, password, idRede){
    const conn = await connect();
    const sql = 'select id_usuario as idUsuario from usuario where email = ? and password = ? and id_rede = ? ';

    const ret = await conn.query(sql, [email, password, idRede]) 
    conn.end()
    return ret;

} 

async function getIdUsuarioDestino(idRede, email){
    const conn = await connect();
    const sql = "select id_usuario as idUsuario from usuario where email = ? and id_rede = ? "
    const ret = await conn.query(sql, [email, idRede]) 
    conn.end()
    return ret;

} 

async function selectExtrato(idUsuario){
    const conn = await connect();
    const sql = `select 'Debito' as tipo, valor, email, mensagem, data from transacao, usuario 
    where id_usuario_orig = ?
    and id_usuario = id_usuario_dest
    union
    select 'Credito' as tipo, valor, email, mensagem, data  from transacao, usuario 
    where id_usuario_dest = ?
    and id_usuario = id_usuario_orig
    order by data desc`
    const ret = await conn.query(sql, [idUsuario, idUsuario]) 
    conn.end()
    return ret;

} 


async function selectEmailEidRedeExiste(idRede, email){
    const conn = await connect();
    const sql = `select count(*) as count from usuario where id_rede = ? and email = ?`
    const ret = await conn.query(sql, [idRede, email]) 
    conn.end()
    return ret;

} 


async function selectGenesis(idRede){
    const conn = await connect();

    const sql = `select t.valor, uo.email as email_origem, ud.email as email_destino, t.data, t.mensagem 
    from transacao t, usuario uo, usuario ud
    where t.id_usuario_orig = uo.id_usuario
    and t.id_usuario_dest = ud.id_usuario 
    and uo.tipo = 0
    and t.id_rede = ? 
    order by t.data desc  `

    const ret = await conn.query(sql, [idRede]) 
    conn.end()
    return ret;

} 

async function insertUsuario(idRede, nome, email, password){
    const conn = await connect();
    const sql = `insert into usuario (nome, email, password, dt_criacao, id_rede, saldo, tipo) 
    values (?,?,?, now(), ?, 0, 1) `;
    const sqlExec = conn.query(sql, [nome, email, password, idRede],function(err,rows){
        if(err) throw err;
        console.log(rows);
    });

    const ret = await sqlExec
    conn.end()
} 

async function insertTransaction(idRede, idUsuarioOrigem, idUsuarioDestino, valor, mensagem){
    const conn = await connect();
    const sql = "CALL transacao(?,?,?,?,?, @result); select @result as result";
    const sqlExec = conn.query(sql, [idRede, idUsuarioOrigem, idUsuarioDestino, valor, mensagem],function(err,rows){
        if(err) throw err;
        console.log(rows);
    });

    const ret = await sqlExec
    conn.end()
    return ret;

} 

module.exports ={selectEmailEidRedeExiste, selectRede, selectLogin, insertTransaction, selectSaldo, selectGenesis, getIdUsuarioDestino, selectExtrato, insertUsuario}