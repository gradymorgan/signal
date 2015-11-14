

var path = require('path');
var express = require('express');
var winston = require('winston');
var fs = require('fs');

var _ = require('lodash');
var handlebars = require('handlebars');


var server = express();

server.use('/', express.static(path.join(__dirname, 'www')));
server.use('/www', express.static(path.join(__dirname, 'www')));
server.use('/data', express.static(path.join(__dirname, 'data')));
server.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));


// //returns current set of data for boat
// server.get('/data/tacks.js', function(req, res) {
//     res.setHeader("content-type", "application/json");
//     fs.createReadStream("./data/tacks.js").pipe(res);
// });

// //returns current set of data for boat
// server.get('/data/tacks_1h.js', function(req, res) {
//     res.setHeader("content-type", "application/json");
//     fs.createReadStream("./data/tacks_1h.js").pipe(res);
// });

// //returns current set of data for boat
// server.get('/data/races.js', function(req, res) {
//     res.setHeader("content-type", "application/json");
//     fs.createReadStream("./data/races.js").pipe(res);
// });

// server.get('/data/races/:race.js', function(req, res) {
//     var race = req.params.race;
//     res.setHeader("content-type", "application/json");
//     fs.createReadStream("./data/races/"+race+".js").pipe(res);
// });

server.set('port', 8080);
var server = server.listen(server.get('port'), function() {
    winston.info('Express server listening on port ' + server.address().port);
});
