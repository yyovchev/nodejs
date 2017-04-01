var util = require('util')
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();


function flightsDB(){

    EventEmitter.call(this);

		// database directory

		this.dir_db = "/home/yordan/Project/raspberry pi/build-untitled-Desktop_Qt_5_7_0_GCC_64bit-Debug/flights";

		// connecting to the db
		this.sqlite3 = require('sqlite3').verbose();
		this.db = new this.sqlite3.Database(this.dir_db);

    // select all items from table flights
	  this.qry  = "SELECT * FROM flights";
	  this.oldflights = [];
}

util.inherits(flightsDB, EventEmitter);

flightsDB.prototype.getData = function(){

    var successful = true;
    var self = this;
    this.emit.apply(this);

    var flights = new Array();	 	/*	Arr with all data from the db
                                      where latitude, longitude or
                                      altitude != 0
                                  */

    this.db.each(this.qry,function(err, row){     // callback for every row
        if (err){
            console.error("Error: " + err);
        }

        if (typeof row === 'undefined'){
          successful = false;
          return;
        }

        let flight = new Object();
        flight.icao = row.ICAO;
        flight.callsign = row.Callsign;
        flight.lat = row.Latitude;
        flight.lon = row.Longitude;
        flight.alt = parseInt(row.Altitude, 10);
        flight.speed = row.Speed;
        flight.vr_speed = row.Vr_speed;
        flight.heading = parseInt(row.Heading, 10);

        /*  add only objects where
            lat lon alt != 0  */
        if (flight.lat * flight.lon != 0){
        flights.push(flight);
        }

      }, function(err, rows){             // on complete
        // console.log(successful);
        if(successful){
          this.oldflights = flights.slice();
        }
        // console.log(flights);
        // console.log(this.oldflights);
        self.emit('dataReady', this.oldflights);
      });

};
var db_conn = new flightsDB();

var ws = require("nodejs-websocket");

function prValues (){
  this.connections = 0;
  this.json = JSON.stringify("");
}

var printV = new prValues;

var server = ws.createServer(function (conn){

  printV.connections++;
	// console.log("new connection ");

	conn.on("text",function (str) {
		// console.log("Received "+ str);
	});

	conn.on("close",function (code, reason) {
		// console.log("Connection closed");
    printV.connections--;
	});

}).listen(8001);

function broadcast(server, msg) {

    let json = JSON.stringify(msg);
    if (typeof json !== 'undefined'){
      printV.json = json;
    } else {
       console.log("not send");
       return;
    }

		server.connections.forEach(function (conn) {
      conn.sendText(json);
		})
}

db_conn.on('dataReady',function (arg) {
	broadcast(server,arg);
})

function timerStart() {
	db_conn.getData();
	setTimeout(timerStart, 5000);
};

function timerPrint() {
  console.log('\033c');
  console.log("Connections " + printV.connections);
  console.log("--------------------------------------------------------");
  console.log("Data :");
	console.log(printV.json);
  setTimeout(timerPrint, 1000);
}

timerStart();
timerPrint();
