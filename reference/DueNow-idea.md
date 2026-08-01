# DueNow

A JIRA-style household project management app

# Parent-Child Work Item Type Structure

* Topic  
  * A grouping of work items that fall under a common theme  
  * Examples: Travel, House, Celebrations, Cleaning  
* Project  
  * Examples: San Diego Trip, Replace Patio Cover, Makena’s Birthday, Kitchen  
* Task  
  * Examples: Book lodging, Get patio cover quotes, Invitations, Clean counters  
* Subtask  
  * Example: Research Airbnb’s, Call contractor 1, Create Invitations, Move appliances

# Work Item Features

* Core fields for all work item types  
  * Summary  
  * Description  
  * Assignee  
  * Status  
    * Open  
    * In Progress  
    * Completed  
    * Closed  
  * Due date  
  * Labels  
  * Comments  
* Configurable Additional Fields by work item type  
* Work item linking with different link types  
  * Examples: Depends on, relates to  
* Work item templates  
* Trigger based automations  
  * Example: When completed, create a clone in X days/weeks/months  
  * Example: Automatically close at   
* Clone work item  
* Closing or completing a parent work item changes the status of its child work items  
* Moving a child work item from open to in progress moves its parent to in progress

# UI Layout

## Bottom tab bar

### Due

* Due Now  
  * Within 24 hours  
* Due Soon  
  * Within 7 days  
* Due Later  
  * Within 30 days  
* Note: Need to think through what types of work items we want to show in each Now/Soon/Later level

### Work Items

* An expandable tree of Topics \> Projects \> Tasks \> Subtasks  
* Clicking on a work item opens the work item details

### Search

* A searchable, sortable, groupable, filterable list of work items

### Settings

* Sign out button in top right corner  
* User settings  
  * Light/dark mode toggle  
* App settings  
  * Template management  
  * Label management  
  * Field management  
  * Automation management

# Tech Stack

* Same stack as /Projects/Supportive, which itself borrows heavily from the /Projects/grace-domain-model/repos/integral-grc tech stack  
* Integral-grc has a mature library of UI modules that we can borrow from