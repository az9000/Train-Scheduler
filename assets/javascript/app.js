$(document).ready(function() {
  var database = firebase.database();

  var trains = [];

  var trainSchedule = [];

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

  $("button").click(function(e) {
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
    database.ref().set({
      trains: trains
    });

    // clear text boxes
    $("#train-name, #train-destination, #first-train-time").val("");
    $("#train-frequency").val(15);
  });

  database.ref().on("value", function(snapshot) {
    if (!snapshot.val()) {
      trains.length = 0;
      cleanUp();
    } else {
      trains = snapshot.val().trains;
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

  function cleanUp() {
    for (var i = 0; i < trainSchedule.length; i++) {
      clearInterval(trainSchedule[i].interval);
    }

    trainSchedule.length = 0;
  }

  function getMinutesAway(firstTime) {
    var hour1 = parseInt(firstTime.split(":")[0]);
    var minute1 = parseInt(firstTime.split(":")[1]);
    var toMilliSeconds1 = hour1 * 3600000 + minute1 * 60000;

    var now = moment();
    var the_time = moment(
      now._d.getHours() + ":" + now._d.getMinutes(),
      "HH:mm"
    );
    var hour2 = parseInt(the_time.format("HH:mm").split(":")[0]);
    var minute2 = parseInt(the_time.format("HH:mm").split(":")[1]);
    var toMilliSeconds2 = hour2 * 3600000 + minute2 * 60000;

    if (hour2 === hour1 && minute2 === minute1) {
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
    } else {
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
    }

    return 0;
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
