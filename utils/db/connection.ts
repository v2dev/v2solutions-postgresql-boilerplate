import { Sequelize } from 'sequelize';
import initUserModel from '../../model/User';
import initEmployeeModel from '../../model/Employee';
import logger from '../../logger/bunyanLogger';

export const logger1 = logger;
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'Cccccccc@20',
  port: 5432,
  database: 'employee-manager-db',
});

const db: any = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = initUserModel(sequelize);
db.employees = initEmployeeModel(sequelize);

export default db;
