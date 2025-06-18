// db.js
import sql from 'mssql';

const config = {
  user: "Indus",
  password: "Param@99811",
  server: "157.20.215.187", // remote server IP
  database: "IndusOkhla",
  port: 1433,
  options: {
    trustServerCertificate: true, // for self-signed certificates
    encrypt: false, // set to true if your server supports TLS/SSL
    enableArithAbort: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to Remote MSSQL Database");
    return pool;
  })
  .catch(err => {
    console.error("❌ Database Connection Failed!", err);
  });

export { sql, poolPromise };
