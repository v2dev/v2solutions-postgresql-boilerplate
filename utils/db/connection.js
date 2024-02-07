const Sequelize = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:Cccccccc@20@localhost:5432/employee-manager-db');
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//models-tables
db.users = require('../../model/User')(sequelize, Sequelize);
db.employees = require('../../model/Employee')(sequelize, Sequelize);

module.exports = db;

