import path from 'path';
import dotenv from 'dotenv';

loadEnv();

function loadEnv() {
  const envFile = '.env.' + process.env.NODE_ENV;

  const { error } = dotenv.config({
    path: path.join('env', envFile),
  });

  if (error) console.error(`Error loading .env file <${envFile}>`, error);
}
