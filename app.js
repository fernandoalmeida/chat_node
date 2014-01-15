/* global console, require, process, __dirname, JSON, setTimeout */
/**
 * Module dependencies.
 */

var express  = require('express');
var routes   = require('./routes');
var user     = require('./routes/user');
var chat     = require('./routes/chat');
var socketio = require('socket.io');
var http     = require('http');
var path     = require('path');
var app      = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/chat', chat.main);
app.get('/users', user.list);

var server = app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = socketio.listen(server);

var clients = {};
var sockets = {};

io.sockets.on('connection', function(socket){

  // Login
  socket.on('set username', function(user){
    if (clients[user] === undefined) {
      clients[user] = socket.id;
      sockets[socket.id] = user;
      available(socket.id, user);
      join(user);
    } else if (clients[user] == socket.id) {
      ignore(socket.id, user);
    } else {
      unavailable(socket.id, user);
    }
  });

  // Message
  socket.on('message', function(data){
    io.sockets.emit('message', {
      source:  data.source,
      message: data.message,
      target:  data.target
    });
  });

});

var available = function(sid, user){
  console.log("available: " + user + " at " + sid);
  io.sockets.sockets[sid].emit('welcome', {user: user, message: "Welcome " + user, current_users: Object.keys(clients)});
};

var unavailable = function(sid, user){
  console.log("unavailable: " + user + " at " + sid);
  if (io.sockets.sockets[sid] != undefined) {
    io.sockets.sockets[sid].emit('error', {unavailable: true, message: "username unavailable"});
  }
};

var join = function(user){
  Object.keys(sockets).forEach(function(sid){
    if (io.sockets.sockets[sid]) {
      io.sockets.sockets[sid].emit('joined', {user: user, notify: true});
    }
  });
};

var ignore = function(sid, user) {
  console.log('ignore');
};