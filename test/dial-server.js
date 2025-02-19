/*******************************************************************************
 * 
 * Copyright (c) 2015 Louay Bassbouss, Fraunhofer FOKUS, All rights reserved.
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.0 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>. 
 * 
 * AUTHORS: Louay Bassbouss (louay.bassbouss@fokus.fraunhofer.de)
 *
 ******************************************************************************/
var dial = require("../index.js");
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var open = require("open");
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var ioSocket = null;

var PORT = 3000;
var MANUFACTURER = "Fraunhofer FOKUS";
var MODEL_NAME = "DIAL Demo Server";

var apps = {
	"Graphene": {
		name: "Graphene",
		state: "stopped",
		allowStop: true,
		pid: null,
        /*
        additionalData: {
            "ex:key1":"value1",
            "ex:key2":"value2"
        },
        namespaces: {
           "ex": "urn:example:org:2014"
        }*/
        launch: function (launchData) {
            open("http://www.youtube.com/tv?"+launchData);
        },
        dispatch: function(data) {
          console.log('dispatch', this.name, data);
          ioSocket.emit('message', data);
        },        
	}
};
var dialServer = new dial.Server({
  expressApp: app,
  port: PORT,
  prefix: "/dial",
	corsAllowOrigins: "*",
	manufacturer: MANUFACTURER,
	modelName: MODEL_NAME,
	/*extraHeaders: {
		"X-MY_HEADER": "My Value"
	},*/
	delegate: {
		getApp: function(appName){
			var app = apps[appName];
			return app;
		},
		launchApp: function(appName,launchData,callback){
			console.log("Got request to launch", appName," with launch data: ", launchData);
			var app = apps[appName];
			var pid = null;
			if (app) {
        if (app.state !== "running") {
          app.pid = "run";
          app.state = "starting";
          app.launch(launchData);
          app.state = "running";
        }
        app.dispatch(launchData);
			}
			callback(app.pid);
		},
		stopApp: function(appName,pid,callback){
            console.log("Got request to stop", appName," with pid: ", pid);
			var app = apps[appName];
			if (app && app.pid == pid) {
				app.pid = null;
				app.state = "stopped";
				callback(true);
			} 
			else {
				callback(false);
			}
    },
	}
});

io.on('connection', function(socket){
  ioSocket = socket;
  console.log('a user connected');
});

server.listen(PORT,function(){
	dialServer.start();
	// dialServer.stop();
	console.log("DIAL Server is running on PORT "+PORT);
});
