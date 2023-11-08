## Sync Jira - Azure

### What is it?
I made this software while working at a company that had a unique problem:

Their customers would report issues through Jira and their CS agents would manage queues there, however, we developers would work on Scrum boards in Azure DevOps. So the CS team would have to constantly monitor the tickets they manually created on Azure and update them in Jira.

This got rid of that problem because it removed the need for them to manually create and update tickets on both sides.

If customers added extra details on Jira, developers on Azure would know. And if developers marked the ticket as done on Azure, customers knew the issue was solved.

### How does it work?
You must setup webhooks on both Jira and Azure and setup the conditional events that trigger issue creation, ticket naming, categorization, etc.

### Is it complete?
Yes and no...
It was working in production however there are a few things that didn't always work like status synchronization and a few others that I never got to do like 100% working attachments.

### Can I use it?
Of course, its licensed under MIT so go ahead and do as you wish with it. If you are interested in a collaboration though contact me, I'd love to complete this work and give it much needed polish.

### How do I use it?
Set up a server with node.js, setup webhooks on Jira and Azure and configure the hardcoded URLs in the code to create issues and tickets on both places. Also modify status keys and templates.

### Is there something I need to keep in mind?
Yes. A few things. First of all the mapping for fields on both platforms. Azure has clear item keys that are easily accessible in your options panel, however Jira item keys are a bit of a problem as they are randomly generated, those have to be mapped by hand. Also many things are string comparisons like status mappings, if those change the system will break. Make sure when assigning fields they are all valid, like use emails that exist in the project, etc. 

I added a lot of logging so it should be clear what is failing and why(I hope), its fairly easy to debug and fix as the code is not very extensive.