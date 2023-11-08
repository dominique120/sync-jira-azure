import { Express } from 'express';
import azure from './azure.routes';
import jira from './jira.routes';

function routesRegister(app: Express) {
  app.use('/jira', jira);
  app.use('/azure', azure);
}

export default routesRegister;
