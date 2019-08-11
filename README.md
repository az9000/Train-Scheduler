# Train-Scheduler

## Demo
https://az9000.github.io/Train-Scheduler/

## Description
A train scheduling app where Firebase Relatime database is utilized to store train arrival/departure times. The JavaScript library is included in the code but is only used here for adding 15 minutes to the next train arrival time. I was not able to figure out how to use the library to calculate the number of minutes remaining until the train arrives. The "diff" function did not produce the correct number of minutes (according to moment.js, there are 504 minutes between 5pm and 9am! Sure! On Fantasy Island maybe!)

## Prerequisites
- JavaScript knowledge
- Firebase account
- Firebase project
- jQuery
- HTML
- CSS
- moment.js (kind of)
- Internet connectivity
- Web browser

## Using Train-Scheduler
Use the "Add Train" form to add the name of the train, its destination, its first arrival time, and how frequently does the train make stops. The train times are limited to times between 6:00am and 9:00pm. The frequency of arriavl is also limited to 15-240 minutes.

You are able to delete a train schedule, but not edit the schedule after creation.

The Firebase database is setup so that the minimum/maximum arrival times can be changed from the DB and updated in the form dynamically.

## Author
Me
