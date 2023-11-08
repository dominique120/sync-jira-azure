import express from 'express';
import morgan from 'morgan';
import path from 'path';
import routesRegister from './routes/routesRegister';
import { createLightship } from 'lightship';
const bodyParser = require('body-parser');

// export const app = express();
export const app = express();
const cors = require('cors');

app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser.json({strict: false}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.set('port', process.env.PORT || 3100);
app.use(morgan('dev'));

routesRegister(app);

app.use(express.static(path.join(__dirname, 'public')));

// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

app.get('/', function(req, res) {
  res.send('Bienvenido a idps-sync-jira-azure');
});

const server = app
  .listen(app.get('port'), () => {
    console.log(
      `idps-sync-jira-azure running on port: ${app.get('port')} in ${app.get('env')} mode`
    );
    lightship.signalReady();
  })
  .on('error', () => {
    lightship.shutdown();
  });

const lightship = createLightship();

lightship.registerShutdownHandler(() => {
  server.close();
});
