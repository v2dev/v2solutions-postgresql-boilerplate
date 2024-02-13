import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import morgan from 'morgan';

import logger from './logger/bunyanLogger'; 

import UserRoute from './swagger/user';
import EmployeeRoute from './swagger/employee';

import db from './utils/db/connection';
db.sequelize.sync();

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'V2Solutions Nodejs BoilerPlate',
      version: '1.0.0',
      description: 'Server with SignIn and Sign Up and CRUD Operation on employee table',
    },
    components: {
      securitySchemes: {
        Authorization: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          value: 'Bearer <JWT token here>',
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
      },
    ],
  },
  apis: ['./swagger/*.js'],
};

const specs = swaggerJsDoc(options);

const app = express();

app.use(morgan('dev'));
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
app.use(
  cors({
    origin: '*',
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(UserRoute);
app.use(EmployeeRoute);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`can't find ${req.originalUrl} on the server!`);
  (err as any).status = 'fail';
  (err as any).statusCode = 404;
  next(err);
});

app.use((error: any, req: Request, res: Response) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info('Server Connected', PORT);
});

export default app;