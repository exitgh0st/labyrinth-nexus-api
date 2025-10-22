const { execSync } = require("child_process");
const liquibaseProperties = require("./generate-liquibase-properties");

// Define the rollback command
// You can specify rollback options like `rollbackCount`, `rollbackToDate`, or `rollbackTag`
const rollbackCount = 1; // Number of changesets to roll back
const command = `liquibase ${liquibaseProperties} rollbackCount ${rollbackCount}`;

execSync(command, { stdio: "inherit" });