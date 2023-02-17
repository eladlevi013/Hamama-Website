var dictionary;
var resultArray;

function getUpdatedSensorList() { // Creates a dictionary of the sensor list, and fill 'x' with the sensor list, that the dropdown will be filled with the sensors.
	var x = document.getElementById("sensor");
	var result = 'HttpHandler?cmd=sensors';
	dictionary = new Map();
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {  // XMLHttpRequest.DONE == 4
         if (xmlhttp.status == 200) { // The HTTP 200 OK success status response code indicates that the request has succeeded.
      	   var sensorsJson = JSON.parse(xmlhttp.responseText);

       	   for(i in sensorsJson){
           	  var option = document.createElement("option");
          	  option.text = sensorsJson[i].displayName;
          	  option.value = parseInt(i)+1;
          	  x.add(option);
          	  dictionary.set(parseInt(sensorsJson[i].id, 10), sensorsJson[i].displayName.toString());
       	   }
         }

      }
  }

    xmlhttp.open("GET", result.toString(), true);
    xmlhttp.send();
}

var chart= undefined;

function addGraph(){
  if(chart != undefined) {
    chart.destroy();
    chart = undefined;
  }

	var from = document.getElementById("fromValue").value;
	var fromUnix = new Date(from).valueOf();
	var to = document.getElementById("toValue").value;
	var toUnix = new Date(to).valueOf();
	var sensor = document.getElementById("sensor").selectedOptions;

  // for (var i = 0; i < sensor.length; i++) {
  //   var a = sensor[i].value;
  // }

  var i = 0;
  var result = 'HttpHandler?cmd=measure&sid=' + sensor[i++].value + '&from=' + fromUnix + '&to=' + toUnix;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
         if(xmlhttp.status == 500) alert("There are no data, for the selected sensor ...")
         if (xmlhttp.status == 200)  { // The HTTP 200 OK success status response code indicates that the request has succeeded.

             var result = JSON.parse(xmlhttp.responseText);
             var resultJson = JSON.parse(result.measures);
             addNewLine(resultJson, i);

             if (i < sensor.length){
                result = 'HttpHandler?cmd=measure&sid=' + sensor[i++].value + '&from=' + fromUnix + '&to=' + toUnix;
                xmlhttp.open("GET", result.toString(), true);
                xmlhttp.send();
             }
         }
      }
}
    xmlhttp.open("GET", result.toString(), true);
    xmlhttp.send();
}

var linesCounter=0;

function toggleDataSeries(e){
  if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
    e.dataSeries.visible = false;
  }
  else{
    e.dataSeries.visible = true;
  }
  chart.render();
}

function addNewLine(resultJson, i){
   sid = i;
   var timeArr = [];
   var valueArr = [];
   var dps = []; // dataPoints array

   for (i in resultJson) {
       timeArr.push(resultJson[i].time);
       valueArr.push(resultJson[i].value);
   }

   for (var i = dps.length; i < timeArr.length; i++)
       dps.push({
         x: new Date(timeArr[i]),
         y: valueArr[i]
       });

   if (chart == undefined){
    chart = new CanvasJS.Chart("chartContainer",
     {
       zoomEnabled: true,
       animationEnabled: true,

       axisX: {
          title: "Dates"
        },
        axisY: {
          title: "Values"
        },
        legend:{
            cursor: "pointer",
            fontSize: 16,
            itemclick: toggleDataSeries
          },
        data: [{
          name: dictionary.get(sid),
          showInLegend: true,
          type: "line",
          dataPoints: dps
        }]
      });
    }

    else {
      chart.addTo("data", {
          name: dictionary.get(sid),
          showInLegend: true,
          type: "line",
          dataPoints: dps
        }, linesCounter);
    }

    linesCounter++
    chart.render();
}

function getHistory(){
	var from = document.getElementById("fromValue").value;
	var fromUnix = new Date(from).valueOf();
	var to = document.getElementById("toValue").value;
	var toUnix = new Date(to).valueOf();
	var sensor = document.getElementById("sensor").value;
	var priority = document.getElementById("priority").value;

	if(sensor==0 && priority!=0) {
    	var result = 'HttpHandler?cmd=log&from=' + fromUnix + '&to=' + toUnix + '&priority=' + priority;
	}

	else if(sensor!=0 && priority==0) {
    	var result = 'HttpHandler?cmd=log&from=' + fromUnix + '&to=' + toUnix + '&sid=' + sensor;
	}

	else if(sensor!=0 && priority!=0) {
	    var result = 'HttpHandler?cmd=log&sid=' + sensor + '&from=' + fromUnix + '&to=' + toUnix + '&priority=' + priority;
	}

	else if(sensor==0 && priority==0){
		var result = 'HttpHandler?cmd=log&from=' + fromUnix + '&to=' + toUnix;
	}

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
         if(xmlhttp.responseText == '[]') alert("There are no data, for those settings ...")
         if (xmlhttp.status == 200) { // The HTTP 200 OK success status response code indicates that the request has succeeded.

             resultArray = JSON.parse(xmlhttp.responseText);
             fillTable(resultArray);
         }
      }
  };

  xmlhttp.open("GET", result.toString(), true);
  xmlhttp.send();
}

function fillTable(resultArray){
	  var string_final = "";
	  string_final += "<tr><th class=table-header><button onclick=sortBySensors()>מקור</button></th>";
	  string_final += "<th class=table-header>הערה</th>";
	  string_final += "<th class=table-header><button onclick=sortByPriority()>עדיפות</button></th>";
	  string_final += "<th class=table-header><button onclick=sortByTime()>תאריך</button></th></tr>";

	   for (i in resultArray) {
		   string_final += "<tr>";

       if(resultArray[i].sid == -1)
           var sensorName = "כללי"
       else
	   	   var sensorName = dictionary.get(resultArray[i].sid);

	     string_final += "<td>" + sensorName + "</td>";
	     string_final += "<td>" + resultArray[i].message + "</td>";

       switch(resultArray[i].priority) {
       		case "info":
       		string_final += '<td><img style="width: 50px; height: 50px;" src="images/info.png"></td>';
       		break;

       		case "warning":
       		string_final += '<td><img style="width: 50px; height: 50px;" src="images/warning.png"></td>';
       		break;

       		case "error":
       		string_final += '<td><img style="width: 50px; height: 50px;" src="images/error.png"></td>';
       		break;
       }

		const date = new Date(parseInt(resultArray[i].time));
		string_final += "<td>" + date.toLocaleDateString("en-US") + "</td>";
		string_final += "</tr>";
		document.getElementById("Board").innerHTML = string_final;
	}
}

function sortBySensors(){
	 // alert("SENSORS");
   resultArray.sort((a,b) => {
    if(a.sid > b.sid) {
      return 1;
    } else {
      return -1;
    }
   })

   fillTable(resultArray);
}

function sortByTime(){
	 //alert("TIME");
      resultArray.sort((a,b) => {
    if(a.time < b.time) {
      return 1;
    } else {
      return -1;
    }
   })

   fillTable(resultArray);
}

function sortByPriority(){
	//alert("PRIORITY");
     resultArray.sort((a,b) => {
    if(a.priority > b.priority) {
      return 1;
    } else {
      return -1;
    }
   })

   fillTable(resultArray);
}

function getSensorList(){
  var result = 'HttpHandler?cmd=sensors';
  var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) { // The HTTP 200 OK success status response code indicates that the request has succeeded.

             var sensorsJson = JSON.parse(xmlhttp.responseText);
               var string_final = "";
               string_final += "<tr><th class=table-header>מזהה</th><th class=table-header>שם חיישן</th><th class=table-header>יחידות</th></tr>";

               for(i in sensorsJson){
                string_final += "<tr>";
                   string_final += "<td>" + sensorsJson[i].id + "</td>";
                   string_final += "<td>" + sensorsJson[i].displayName + "</td>";

                 if(sensorsJson[i].units == "")
                       string_final += "<td>NONE</td>";
                 else
                       string_final += "<td>" + sensorsJson[i].units + "</td>";

                 string_final += "</tr>";
               }
               document.getElementById("Board").innerHTML = string_final;
           }
        }
    }

    xmlhttp.open("GET", result.toString(), true);
    xmlhttp.send();
}
