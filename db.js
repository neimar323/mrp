
async function connect(){
    if(global.connection && global.connection.state !== 'disonnected')
        return global.connection;

    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection(process.env.CLEARDB_DATABASE_URL.replace('?reconnect=true', ''));
    console.log("conectou no MySQL");
    global.connection = connection
    return connection;
}


async function selectRede(){
    const conn = await connect();
    const rows = conn.query('select id_rede, nome from rede');
    console.log(rows)
    return await rows;
} 

module.exports ={selectRede}