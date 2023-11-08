import { Request, Response } from "express";
import axios from 'axios';
const chalk = require('chalk');

const authHeaderAzure = ""; // Your Authorization header to access Azure
const authHeaderJira = ""; // Your Authorization header to access Jira

export async function handleHookAzure(incomingReq: Request, outgoingRes: Response) {
  const obj = incomingReq.body
  const azureId = obj.resource.workItemId

  console.log(JSON.stringify(obj))
  if (obj.resource.revision.fields["System.WorkItemType"] == "Bug") {
    if (obj.resource.fields) {
      if (obj.resource.fields["System.State"]) {
        console.log(chalk.green(
          "\nAzure: Bug #" +
          obj.resource.workItemId +
          " was updated to \"" +
          obj.resource.fields["System.State"].newValue +
          "\" from \"" +
          obj.resource.fields["System.State"].oldValue +
          "\"."
        ))

        if (obj.resource.fields["System.State"].newValue.toLowerCase() == "to do") {
          // might happen, need to handle it somehow
        } else if (obj.resource.fields["System.State"].newValue.toLowerCase() == "in progress") {
          // transition jira state to "IT: WORK IN PROGRESS"
          transitionJiraTicket(azureId, "IT: WORK IN PROGRESS")
        } else if (obj.resource.fields["System.State"].newValue.toLowerCase() == "pruebas unitarias") {
          // transition jira state to "IT: VALIDATING SOLUTION"
          transitionJiraTicket(azureId, "IT: VALIDATING SOLUTION")
        } else if (obj.resource.fields["System.State"].newValue.toLowerCase() == "ready for qa") {
          // transition jira state to "READY FOR QA"
          transitionJiraTicket(azureId, "Ready for QA")
        } else if (obj.resource.fields["System.State"].newValue.toLowerCase() == "qa validation") {
          // transition jira state to "QA: In Progress"
          transitionJiraTicket(azureId, "QA: In Progress")
        } else if (obj.resource.fields["System.State"].newValue.toLowerCase() == "customer validation") {
          // transition jira state to "CS: Validating Solution"
          transitionJiraTicket(azureId, "CS: Validating Solution")
        }
      }
    }
  }
  outgoingRes.statusCode = 200;
  outgoingRes.send();
}


export async function transitionJiraTicket(azureId: String, transitionTo: String) {
  /*
    1. Get JiraID from the Azure ticket
    2. Get possible states that the issue can be transitioned to
    3. transition to that state if its available
        3.1 if not add to Azure item the following tag "Status Mismatch"
*/

  var jiraId: String = "";
  var statusOnAzure: String = ""
  var statusOnJira: String = ""
  await axios.get(
    'https://dev.azure.com/project/AIR/_apis/wit/workitems/' + azureId + '?api-version=7.1-preview.3',
    { // config
      headers: {
        "Authorization": authHeaderAzure,
        "Content-Type": "application/json-patch+json"
      }
    }
  ).then(o => {
    jiraId = o.data.fields["Custom.JiraID"];
    statusOnAzure = o.data.fields["System.State"];
    console.log(chalk.green("Fetched Azure ticket: " + azureId));
    console.log(JSON.stringify(o.data));
  }).catch(err => {
    if (err.response.status == 404) {
      console.log(chalk.red("Could not find Azure ticket with id " + azureId));
    } else {
      console.log(err);
    }
  });

  await axios.get(
    'https://project.atlassian.net/rest/api/3/issue/' + jiraId,
    { // config
      headers: {
        "Authorization": authHeaderJira,
        "Content-Type": "application/json"
      }
    }
  ).then(o => {
    statusOnJira = o.data.fields.status.name;
    console.log(chalk.green("Fetched Jira ticket " + jiraId))
  }).catch(err => {
    if (err.response.status == 404) {
      console.log(chalk.red("Could not find Jira ticket with id " + jiraId))
    } else {
      console.log(err);
    }
  });



  // TODO: Compare statuses and figure out a way to 
  // ensure that they dont get overwritten in a loop when triggering webhooks

  var transitionToId: String = "";
  // Get transition Ids for issue
  await axios
    .get(
      "https://project.atlassian.net/rest/api/3/issue/" + jiraId + "/transitions",
      {
        // config
        headers: {
          Authorization: authHeaderJira,
          "Content-Type": "application/json"
        },
      }
    )
    .then((o) => {
      //console.log("Jira ticket " + jiraId + " was updated with Azure ticket " + azureId);
      for (const transition of o.data.transitions) {
        if (transition.to.name.toLowerCase() == transitionTo.toLowerCase()) {
          transitionToId = transition.id;
          console.log(chalk.green("Found transition for " + jiraId + " -> " + transitionTo))
        } else {
          console.log(chalk.red("Could not find transition for " + jiraId + " -> " + transitionTo))
          //replaceAzureTag(azureId, "Status Mismatch")
        }
      }





      // transition issue ONLY if we could find them
      axios
        .post(
          "https://project.atlassian.net/rest/api/3/issue/" + jiraId + "/transitions", {
          transition: {
            id: transitionToId// Id to transition to
          }
        },
          {
            // config
            headers: {
              Authorization: authHeaderJira,
              "Content-Type": "application/json"
            },
          }
        )
        .then((o) => {
          //console.log("Jira ticket " + jiraId + " was updated with Azure ticket " + azureId);
          console.log(chalk.green(jiraId + " was transitioned to " + transitionTo))
        })
        .catch((err) => {
          if (err.response.status == 404) {
            console.log(chalk.red("Could not find jira ticket with id " + jiraId))
          } else {
            console.log(chalk.red(jiraId + " could not be transitioned to " + transitionTo))
            //replaceAzureTag(azureId, "Status Mismatch")
            console.log(chalk.dim(err));
          }
        });

    })
    .catch((err) => {
      if (err.response.status == 404) {
        console.log(chalk.red("Could not find jira ticket with id " + jiraId))
      } else {
        console.log(chalk.dim(err));
      }
    });
}