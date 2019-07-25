$(document).ready(function() {
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyAPbo_BOaLlqYUpCMzcIMApgfKz4u34xrI",
    authDomain: "train-scheduler-dbbca.firebaseapp.com",
    databaseURL: "https://train-scheduler-dbbca.firebaseio.com",
    projectId: "train-scheduler-dbbca",
    storageBucket: "",
    messagingSenderId: "746730831692",
    appId: "1:746730831692:web:4379faf6d3475e77"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  var database = firebase.database();

  var trains = [];

  var trainSchedule = [];

  var trainToRemoveIndex = -1;

  var min_time = "";

  var max_time = "";

  function Train(index, name, frequency) {
    (this.index = index),
      (this.name = name),
      (this.frequency = frequency),
      (this.intervalStarted = false),
      (this.interval = setInterval(() => {
        this.intervalStarted = true;
        var minAway = getMinutesAway(trains[this.index].trainTime);
        var td_id = "#td-min-away-" + this.index;
        $(td_id).html(minAway);
        var hour = parseInt(trains[this.index].trainTime.split(":")[0]);
        var minute = parseInt(trains[this.index].trainTime.split(":")[1]);
        var the_time = moment(hour + ":" + minute, "HH:mm");
        if (minAway === 0) {
          the_time.add(trains[this.index].frequency, "m");
          database.ref("/trains/" + this.index).update({
            name: this.name,
            destination: trains[this.index].destination,
            frequency: trains[this.index].frequency,
            trainTime: the_time.format("HH:mm")
          });
        }
      }, 60000));
  }

  // collect data
  var trainName, trainDestination, firstTrainTime, trainFrequency, minutesAway;

  $("#addTrain").click(function(e) {
    e.preventDefault();

    trainName = $("#train-name")
      .val()
      .trim();
    if (trainName.length === 0) {
      alert("Enter a Train Name Please!");
      $("#train-name").val("");
      return;
    }

    if (trainExists(trainName)) {
      alert("Enter a NEW Train Name Please!");
      $("#train-name").val("");
      return;
    }

    trainDestination = $("#train-destination")
      .val()
      .trim();
    if (trainDestination.length === 0) {
      alert("Enter a Train Destination Please!");
      $("#train-destination").val("");
      return;
    }

    firstTrainTime = $("#first-train-time")
      .val()
      .trim();
    if (firstTrainTime.length === 0) {
      alert("Enter a Train Time Please!");
      $("#first-train-time").val("");
      return;
    }
    if (!firstTrainTime.match("^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$")) {
      alert("Enter a VALID Train Time Please (HH:mm - 24-hour format)!");
      $("#first-train-time").val("");
      return;
    }
    // check for min and max values
    if (!validTimeRange(firstTrainTime)) {
      alert(
        "Enter a VALID Train Time Please (between " +
          min_time +
          " and " +
          max_time +
          ")!"
      );
      $("#first-train-time").val("");
      return;
    }

    trainFrequency = parseInt(
      $("#train-frequency")
        .val()
        .trim()
    );
    if (firstTrainTime.length === 0) {
      alert("Choose a Frequency Please!");
      return;
    }

    var hour = parseInt(firstTrainTime.split(":")[0]);
    var minute = parseInt(firstTrainTime.split(":")[1]);
    var the_time = moment(hour + ":" + minute, "HH:mm");
    console.log(the_time.format("HH:mm"));

    minutesAway = getMinutesAway(firstTrainTime);

    // add to the array, if it doesn't exist
    trains.push({
      name: trainName,
      destination: trainDestination,
      frequency: trainFrequency,
      trainTime: the_time.format("HH:mm")
    });

    if (!trainScheduleExists(trainName)) {
      train = new Train(trainSchedule.length, trainName, trainFrequency * 1000);
      trainSchedule.push(train);
      console.log(trainSchedule);
    }

    //
    database.ref().update({
      trains: trains
    });

    // clear text boxes
    $("#train-name, #train-destination, #first-train-time").val("");
    $("#train-frequency").val(15);
  });

  $("#removeTrain").click(function(e) {
    e.preventDefault();
    if (trainToRemoveIndex >= 0) {
      trains.splice(trainToRemoveIndex, 1);
      database.ref().update({
        trains: trains
      });
    }
  });

  // database status updates
  database.ref().on("value", function(snapshot) {
    if (!snapshot.val()) {
      trains.length = 0;
      cleanUp();
    } else {
      if (snapshot.val().trains) {
        trains = snapshot.val().trains;
      }
      if (snapshot.val().min_time) {
        if (snapshot.val().min_time !== min_time) {
          min_time = snapshot.val().min_time;
          console.log(min_time);
        }
      }
      if (snapshot.val().max_time) {
        if (snapshot.val().max_time !== max_time) {
          max_time = snapshot.val().max_time;
          console.log(max_time);
        }
      }
    }
    var train;
    $("tbody").empty();
    for (var i = 0; i < trains.length; i++) {
      var tr = $("<tr>");
      var td = $("<td>");
      td.attr("id", "td-name-" + i);
      td.html(trains[i].name);
      tr.append(td);

      td = $("<td>");
      td.attr("id", "td-destination-" + i);
      td.html(trains[i].destination);
      tr.append(td);

      td = $("<td>");
      td.attr("id", "td-frequency-" + i);
      td.html(trains[i].frequency);
      tr.append(td);

      td = $("<td>");
      td.attr("id", "td-time-" + i);
      td.html(trains[i].trainTime);
      tr.append(td);

      td = $("<td>");
      td.attr("id", "td-min-away-" + i);
      td.html(getMinutesAway(trains[i].trainTime));
      tr.append(td);

      td = $("<td>");
      td.attr("id", "td-remove-" + i);
      var id = "trash-" + i;
      td.html(
        '<i class="fa fa-trash" id="' +
          id +
          '" aria-hidden="true" style="cursor: pointer;" data-toggle="modal" data-target="#areYouSureModalCenter"></i>'
      );
      tr.append(td);

      $("tbody").append(tr);

      if (!trainScheduleExists(trains[i].name)) {
        train = new Train(
          trainSchedule.length,
          trains[i].name,
          trains[i].frequency * 1000
        );
        trainSchedule.push(train);
        console.log(trainSchedule);
      }
    }
  });

  $(document).on("click", ".fa-trash", function(event) {
    event.preventDefault();
    trainToRemoveIndex = parseInt(
      $(this)
        .attr("id")
        .split("-")[1]
    );
    console.log("remove " + trains[trainToRemoveIndex].name);
  });

  function cleanUp() {
    for (var i = 0; i < trainSchedule.length; i++) {
      clearInterval(trainSchedule[i].interval);
    }

    trainSchedule.length = 0;
  }

  function getMinutesAway(trainTime) {
    
    var hour1 = parseInt(trainTime.split(":")[0]);
    var minute1 = parseInt(trainTime.split(":")[1]);
    var toMilliSeconds1 = hour1 * 3600000 + minute1 * 60000;

    var now = moment();
    var the_time = moment(
      now._d.getHours() + ":" + now._d.getMinutes(),
      "HH:mm"
    );

    var hour2 = parseInt(the_time.format("HH:mm").split(":")[0]);
    var minute2 = parseInt(the_time.format("HH:mm").split(":")[1]);
    var toMilliSeconds2 = hour2 * 3600000 + minute2 * 60000;
    console.log("*********************");

    if (toMilliSeconds1 === toMilliSeconds2) {
      return 0;
    }

    // is this hour > train hour?
    if (hour2 > hour1) {
      var hour_diff = 24 - (hour2 - hour1);
      var min_diff;
      if (minute2 > minute1) {
        min_dif = 60 - (minute2 - minute1);
        hour_diff--;
      } else {
        min_dif = minute1 - minute2;
      }
      var t = moment(hour_diff + ":" + min_dif, "HH:mm");

      return (hour_diff * 3600000 + min_dif * 60000) / 60000;
    } else if (hour2 < hour1) {
      var hour_diff = hour1 - hour2;
      var min_diff;
      if (minute2 > minute1) {
        min_dif = 60 - (minute2 - minute1);
        hour_diff--;
      } else {
        min_dif = minute1 - minute2;
      }
      var t = moment(hour_diff + ":" + min_dif, "HH:mm");

      return (hour_diff * 3600000 + min_dif * 60000) / 60000;
    } else {
      // equal hours, but different minutes
      var hour_diff = hour1 - hour2;
      var min_diff;
      if (minute2 > minute1) {
        hour_diff = 24;
        min_diff = minute2 - minute1;
      } else {
        min_dif = minute1 - minute2;
      }
      var t = moment(hour_diff + ":" + min_dif, "HH:mm");

      return (hour_diff * 3600000 + min_dif * 60000) / 60000;
    }

    return 0;

  }

  function validTimeRange(firstTrainTime) {
    var hours = parseInt(firstTrainTime.split(":")[0]);
    var minutes = parseInt(firstTrainTime.split(":")[1]);
    var toMilliSeconds1 = hours * 3600000 + minutes * 60000;

    var min_time_hours = parseInt(min_time.split(":")[0]);
    var min_time_minutes = parseInt(min_time.split(":")[1]);
    var toMilliSeconds2 = min_time_hours * 3600000 + min_time_minutes * 60000;

    var max_time_hours = parseInt(max_time.split(":")[0]);
    var max_time_minutes = parseInt(max_time.split(":")[1]);
    var toMilliSeconds3 = max_time_hours * 3600000 + max_time_minutes * 60000;

    return (
      toMilliSeconds1 >= toMilliSeconds2 && toMilliSeconds1 <= toMilliSeconds3
    );
  }

  function trainExists(name) {
    for (var i = 0; i < trains.length; i++) {
      if (trains[i].name.toLowerCase() === name.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  function trainScheduleExists(name) {
    for (var i = 0; i < trainSchedule.length; i++) {
      if (trainSchedule[i].name.toLowerCase() === name.toLowerCase()) {
        return true;
      }
    }

    return false;
  }
});
