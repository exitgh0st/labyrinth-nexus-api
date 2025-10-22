const { execSync } = require("child_process");
const liquibaseProperties = require("./generate-liquibase-properties");

const command = `liquibase ${liquibaseProperties} update`;

execSync(command, { stdio: "inherit" });