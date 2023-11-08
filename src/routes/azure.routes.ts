import { Router } from 'express';
import { handleHookAzure } from '../request-handler/azure/receive-hook';

const azure = Router();

/** 
 * @swagger
 * /azure/register-event:
 *  post:
 *      summary: 
 *      tags: [Azure receive service hook]
 *      consumes:
 *          - application/json
 *      parameters:
 *      requestBody:
 *          content:
 *              'application/json':
 *                  schema:
 *                      type: object
 *      responses:
 *          '200':
 *              description: ok
 *          '401':
 *              description: Unauthorized
 *                              
*/
azure.post('/register-event', handleHookAzure);

export default azure;
