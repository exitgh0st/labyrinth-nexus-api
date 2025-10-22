const dotenv = require("dotenv");
const path = require("path");

const environment = process.env.NODE_ENV || "development";
const envFilePath = path.resolve(__dirname, `../.env.${environment}`); // Adjusted path to .env file
dotenv.config({path: envFilePath });

const liquibaseProperties = `--url="${process.env.JDBC_DATABASE_URL}" --username="${process.env.DB_USER}" --password="${process.env.DB_PASSWORD}" --changeLogFile=db.changelog-master.xml`;

module.exports = liquibaseProperties;