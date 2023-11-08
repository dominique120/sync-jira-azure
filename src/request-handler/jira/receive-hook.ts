import { Request, Response } from "express";
import axios from 'axios';
const chalk = require('chalk');

class AzureOp {
    op: String = "";
    path: String = "";
    value: String = "";
    constructor(op: String, path: String, value: String) {
        this.op = op;
        this.path = path;
        this.value = value;
    }
}

const authHeaderAzure = ""; // Your Authorization header to access Azure
const authHeaderJira = ""; // Your Authorization header to access Jira

export async function handleHookJira(incomingReq: Request, outgoingRes: Response) {
    const obj = incomingReq.body

    console.log("RxJH 1: Received a hook from JIRA: ", JSON.stringify(obj))

    if (obj.webhookEvent == "jira:issue_created") {
        /*
                console.log(chalk.green(
                    "\nJira issue " +
                    obj.issue.key +
                    " was created."
                ))
        */
        // do nothing   
    } else if (obj.webhookEvent == "jira:issue_updated") {
        // if (obj.issue.fields.customfield_11097) {
        for (const change of obj.changelog.items) {
            if (change.field == "status") {
                console.log(chalk.green(
                    "\nJira issue " +
                    obj.issue.key +
                    ' was updated to "' +
                    change.toString +
                    '" from "' +
                    change.fromString +
                    '".'
                ));

                const azureId: String = obj.issue.fields.customfield_11097
                const changeTo: String = change.toString.toLowerCase();
                if (changeTo == "OPEN".toLowerCase()) {
                    // should not happen
                } else if (changeTo == "CS: IN REVIEW".toLowerCase()) {
                    // nothing
                } else if (changeTo == "CS: WORK IN PROGRESS".toLowerCase()) {
                    // nothing
                } else if (changeTo == "SCALE TO IT".toLowerCase()) {
                    // create ticket here
                    console.log("Jira ticket has been moved to SCALE TO IT")

                    // if the ticket has already been manually linked dont create the ticket
                    if (!obj.issue.fields.customfield_11097) {
                        createAzureIssue(obj);
                    } else {
                        console.log("Ticket with ID: ", azureId, " already exists.")
                    }

                } else if (changeTo == "WAITING FOR THIRD PARTIES".toLowerCase()) {
                    // nothing
                } else if (changeTo == "IT: IN BACKLOG".toLowerCase()) {
                    // Set Azure state to "To Do" and set "Ready for Development" tag
                    updateAzureState(azureId, "To Do");
                    //replaceAzureTag(azureId, "Ready for Development")
                    console.log(chalk.green(azureId + " set to To Do"))
                } else if (changeTo == "IT: WORK IN PROGRESS".toLowerCase()) {
                    // Will be set by Azure
                } else if (changeTo == "IT: VALIDATING SOLUTION".toLowerCase()) {
                    // Will be set by Azure
                } else if (changeTo == "READY FOR QA".toLowerCase()) {
                    // Will be set by Azure
                } else if (changeTo == "QA: IN PROGRESS".toLowerCase()) {
                    // Will be set by Azure
                } else if (changeTo == "CS: VALIDATING SOLUTION".toLowerCase()) {
                    // Set state to "Customer Validation"
                    updateAzureState(azureId, "Customer Validation");
                    //replaceAzureTag(azureId, "")
                    console.log(chalk.green(azureId + " set to Customer Validation"))
                } else if (changeTo == "DECLINED".toLowerCase()) {
                    // Set state to "Removed"
                    //updateAzureState(azureId, "Removed");
                    replaceAzureTag(azureId, "Declined")
                    console.log(chalk.green(azureId + " set to Removed"))
                } else if (changeTo == "CS: CUSTOMER VALIDATION".toLowerCase()) {
                    // Will be set by Azure
                } else if (changeTo == "READY FOR RELEASE".toLowerCase()) {
                    // Set tag Azure tag to "RDY"
                    updateAzureState(azureId, "Customer Validation");
                    //replaceAzureTag(azureId, "RDY")
                    console.log(chalk.green(azureId + " set to Customer Validation"))
                } else if (changeTo == "USER VALIDATION".toLowerCase()) {
                    // Set state to "Customer Validation"
                    updateAzureState(azureId, "Customer Validation");
                    //replaceAzureTag(azureId, "")
                    console.log(chalk.green(azureId + " set to Customer Validation"))
                } else if (changeTo == "COMPLETED".toLowerCase()) {
                    // Set to "Done"
                    updateAzureState(azureId, "Done");
                    //replaceAzureTag(azureId, "")
                    console.log(chalk.green(azureId + " set to Done"))
                } else if (changeTo == "CLOSED".toLowerCase()) {
                    // Set to "Done"
                    updateAzureState(azureId, "Done");
                    //replaceAzureTag(azureId, "")
                    console.log(chalk.green(azureId + " set to Done"))
                } else {
                    console.log(chalk.red("JIRA STATUS: " + change.toString + " NOT RECOGNIZED"))
                    //replaceAzureTag(azureId, "Status Mismatch")
                }
            }
        }
    }
    // }

    outgoingRes.statusCode = 200;
    outgoingRes.send();

}

export function updateAzureState(itemId: String, state: String) {
    var body: AzureOp[] = [];
    var azureId: String;

    body.push({ op: "add", path: "/fields/System.State", value: state })

    axios.patch(
        'https://dev.azure.com/project/AIR/_apis/wit/workitems/' + itemId + '?api-version=7.1-preview.3',
        body,
        { // config
            headers: {
                "Authorization": authHeaderAzure,
                "Content-Type": "application/json-patch+json"
            }
        }
    ).then(o => {
        azureId = o.data.id;
        console.log(chalk.green("Azure ticket " + o.data.id + " was updated to: " + o.data.fields["System.State"]))
        console.log(JSON.stringify(o.data))
    }).catch(err => {
        if (err.response.status == 404) {
            console.log(chalk.red("Could not find Azure ticket with id " + itemId))
        } else {
            console.log(err);
        }
    });
}

export function replaceAzureTag(itemId: String, newTag: String) {
    var body: AzureOp[] = [];

    body.push({ op: "replace", path: "/fields/System.Tags", value: newTag })

    axios.patch(
        'https://dev.azure.com/project/AIR/_apis/wit/workitems/' + itemId + '?api-version=7.1-preview.3',
        body,
        { // config
            headers: {
                "Authorization": authHeaderAzure,
                "Content-Type": "application/json-patch+json"
            }
        }
    ).then(o => {
        console.log(chalk.green("Azure ticket tags" + o.data.id + " are now: " + o.data.fields["System.Tags"]))
        console.log(JSON.stringify(o.data))
    }).catch(err => {
        if (err.response.status == 404) {
            console.log(chalk.red("Could not find Azure ticket with id " + itemId))
        } else {
            console.log(err);
        }
    });
}

export async function createAzureIssue(obj: any) {
    // Log that an issue was created on Jira
    var jiraId = obj.issue.key;

    // Create azure object
    var body: AzureOp[] = [];

    // optional fields
    if (obj.issue.fields.customfield_10955) {
        body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria", value: obj.issue.fields.customfield_10955 })
    }
    if (obj.issue.fields.customfield_10955) {
        body.push({ op: "add", path: "/fields/Microsoft.VSTS.TCM.ReproSteps", value: obj.issue.fields.customfield_10929 })
    }

    // Build System Info
    var sysInfo: String = "";
    if (obj.issue.fields.description) {
        sysInfo = sysInfo + "<div><b>Description</b></div>"
        sysInfo = sysInfo + "<div>" + obj.issue.fields.description + "<div>"
    }
    if (obj.issue.fields.customfield_10951) {
        sysInfo = sysInfo + "<br><br><div><b>Ubicación del Menú</b></div>"
        sysInfo = sysInfo + "<div>" + obj.issue.fields.customfield_10951 + "<div>"
    }
    if (obj.issue.fields.customfield_10200._links.web) {
        sysInfo = sysInfo + "<br><br><div><b>Jira Link</b></div><br>"
        sysInfo = sysInfo + obj.issue.fields.customfield_10200._links.web
    }
    body.push({ op: "add", path: "/fields/Microsoft.VSTS.TCM.SystemInfo", value: sysInfo })


    if (obj.issue.fields.customfield_10938.value == "MXFNX01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Fenix" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "Customer Solutions\\Fenix - BACKLOG" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "Customer Solutions\\Fenix Team" })
    } else if (obj.issue.fields.customfield_10938.value == "MXMKP01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Other" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "MXSV201") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Servi2" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "Customer Solutions\\Backlog 9 - Mejoras Servi2 performance" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "Customer Solutions\\Servi2 - Mejoras" })
    } else if (obj.issue.fields.customfield_10938.value == "CLSOD01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Sodimac" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "COSOD01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Sodimac" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "LASOC01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Sodimac" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "CLSURA01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Sura" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "CLACCH01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "ACCh" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "MXIKE01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Ike" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "ARIKE01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Ike" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "COIKE01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Ike" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "MXLIV01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Livit" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "COENEL01") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Enel" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "SAAS") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "SaaS" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else if (obj.issue.fields.customfield_10938.value == "Otra") {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "Otra" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    } else {
        body.push({ op: "add", path: "/fields/Custom.Customer", value: "SaaS" })
        body.push({ op: "add", path: "/fields/System.IterationPath", value: "AIR\\SaaS 2.0\\Incidencias por clasificar" })
        body.push({ op: "add", path: "/fields/System.AreaPath", value: "AIR\\SaaS 2.0" })
    }


    // Severity mapping
    if (obj.issue.fields.priority.name) {
        var sev = obj.issue.fields.priority.name;
        if (sev == "Menor") {
            body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: "4 - Low" })
        } else if (sev == "Mayor") {
            body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: "3 - High" })
        } else if (sev == "Crítica") {
            body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: "2 - Critical" })
        } else if (sev == "Bloqueante") {
            body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: "1 - Blocker" })
        }
    } else {
        body.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: "4 - Low" })
    }

    // obligatory fields        
    body.push({ op: "add", path: "/fields/System.Title", value: "Integración Jira: " + obj.issue.fields.summary })
    body.push({ op: "add", path: "/fields/Custom.CreatedIteration", value: "PROD" })
    body.push({ op: "add", path: "/fields/System.Tags", value: "In CS Triage;" })
    body.push({ op: "add", path: "/fields/Custom.Developer", value: "test@email.com" })
    body.push({ op: "add", path: "/fields/Custom.StageTest", value: "PROD" })
    body.push({ op: "add", path: "/fields/Custom.JiraId", value: obj.issue.key })
    body.push({ op: "add", path: "/fields/Custom.Environment", value: "PROD" })


    // Create issue on Azure
    var azureId = "";
    await axios.post(
        'https://dev.azure.com/project/AIR/_apis/wit/workitems/$Bug?api-version=6.0',
        body,
        { // config
            headers: {
                "Authorization": authHeaderAzure,
                "Content-Type": "application/json-patch+json"
            }
        }
    ).then(o => {
        azureId = o.data.id;
        console.log(chalk.green("Azure ticket was created with id: " + o.data.id))
        console.log(JSON.stringify(o.data))
    }).catch(err => {
        if (err.response.status == 404) {
            console.log(chalk.red("Could not find Azure ticket with id " + azureId))
        } else {
            console.log(err);
        }
    });


    // update jira issue with azure ID and link
    await axios.put(
        'https://project.atlassian.net/rest/api/3/issue/' + jiraId,
        {
            fields: {
                customfield_11097: "" + azureId// update field issue.fields.customfield_11097
            }
        },
        { // config
            headers: {
                "Authorization": authHeaderJira,
                "Content-Type": "application/json"
            }
        }
    ).then(o => {
        console.log(chalk.green("Jira ticket " + jiraId + " was updated with Azure ticket " + azureId))
    }).catch(err => {
        if (err.response.status == 404) {
            console.log(chalk.red("Could not find Jira ticket with id " + jiraId))
        } else {
            console.log(err);
        }
    });

    return azureId;

}

/*
          Flow for webhookEvent = "jira:issue_created"
      1. Receive and process hook - DONE
      2. Create bug on Azure with Jira key - DONE
      3. Update Jira issue with Azure Id and link (Excluded)

          Flow for webhookEvent = "jira:issue_updated"
      1. Receive and process hook
      2. Check if issue.fields.customfield_11097(azureId) is set.

  */

/*
      Create an item in Azure DevOps:
      Send a POST to: https://dev.azure.com/project/AIR/_apis/wit/workitems/$Bug?api-version=6.0


      Body is:

      [
          {
              "op": "add",
              "path": "/fields/System.Title",
              "from": null,
              "value": "PRUEBA INTEGRACION JIRA"
          },
          {
              "op": "add",
              "path": "/fields/System.IterationPath",
              "from": null,
              "value": "AIR\\SaaS 2.0\\Incidencias por clasificar"
          },
          {
              "op": "add",
              "path": "/fields/System.AreaPath",
              "from": null,
              "value": "AIR\\SaaS 2.0"
          },
          {
              "op": "add",
              "path": "/fields/Custom.CreatedIteration",
              "from": null,
              "value": "PROD"
          },
          {
              "op": "add",
              "path": "/fields/Custom.Developer",
              "from": null,
              "value": "test@email.com"
          },
          {
              "op": "add",
              "path": "/fields/Custom.StageTest",
              "from": null,
              "value": "PROD"
          },    {
              "op": "add",
              "path": "/fields/Custom.JiraId",
              "from": null,
              "value": "123"
          },
          {
              "op": "add",
              "path": "/fields/Custom.Environment",
              "from": null,
              "value": "PROD"
          },
          {
              "op": "add",
              "path": "/fields/Microsoft.VSTS.Common.Severity",
              "from": null,
              "value": "1 - Critical"
          }
      ]
  */

/*
  Azure Field Name                            Jira Custom Field Name
  /fields/Custom.JiraId                       issue.key
  /fields/System.Title                        issue.fields.summary
  /fields/Microsoft.VSTS.Common.AcceptanceCriteria  issue.fields.customfield_10955 = Criterio de aceptación detallado de cómo debería verse la solución",
  /fields/Microsoft.VSTS.TCM.ReproSteps       issue.fields.customfield_10929 = Pasos para replicar el problema
  

  (all three go to system info)
  /fields/Microsoft.VSTS.TCM.SystemInfo       issue.fields.description = Descripción del problema
  (add to system info)                        issue.fields.customfield_10200._links.web = link to /servicedesk/customer
  (add to system info)                        issue.fields.customfield_10951 = Breadcrumb / Ubicación del Menú


  (requires mapping)
  /fields/Microsoft.VSTS.Common.Severity      issue.fields.priority.name(requires mapping!)

  (extra fields I need)
  issue.fields.customfield_11097 = Id for Azure bug number


*/

