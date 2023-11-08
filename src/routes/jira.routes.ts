import { Router } from 'express';
import { handleHookJira } from '../request-handler/jira/receive-hook';

const jira = Router();

/** 
 * @swagger
 * /jira/register-event:
 *  post:
 *      summary: 
 *      tags: [Jira receive service hook]
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
jira.post('/register-event', handleHookJira);

export default jira;
