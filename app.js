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

var usernames   = {};
var sockets_ids = {};

io.sockets.on('connection', function(socket){

  // Login
  socket.on('user_sign_in', function(data){
    if (!sockets_ids[data.username]) {
      usernames[socket.id]       = data.username;
      sockets_ids[data.username] = socket.id;

      socket.emit('sign_in_success', { username: data.username, message: "Welcome " + data.username, current_users: Object.keys(sockets_ids) });
      socket.broadcast.emit('user_signed_in', { username: data.username });

      console.log(data.username + ' signed in');
    } else {
      socket.emit('error', { error: 'sign_in_error', message: "username unavailable" });

      console.log('sign in error: ' + data.username + ' already in use');
    }
  });

  // Logout
  socket.on('user_sign_out', function(){
    socket.broadcast.emit('user_signed_out', { username: usernames[socket.id] });
    
    delete sockets_ids[usernames[socket.id]];
    delete usernames[socket.id];

    if (!usernames[socket.id]) {
      socket.emit('sign_out_success');

      console.log('user signed out');
    } else {
      socket.emit('error', { error: 'sign_out_error', message: "error on signout" });

      console.log('user sign out error');
    }
  });
  
  // Message
  socket.on('send_message', function(data){
    if ( data.target == 'all' ) {
      io.sockets.emit('receipt_public_message', { username:  usernames[socket.id], message: data.message });

      console.log(usernames[socket.id] + ' sent a public message');
    } else {
      if (sockets_ids[data.target]) {
	io.sockets.socket(sockets_ids[data.target]).emit('receipt_private_message', { username:  usernames[socket.id], message: data.message });

	console.log(usernames[socket.id] + ' sent a private message to ' + data.target);
      } else {
	socket.emit('error', { error: 'user_not_found', message: "user not found" });

	console.log('user ' + data.target + ' not found');
      }
    }
  });

});