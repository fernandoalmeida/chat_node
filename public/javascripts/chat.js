/* global io, $, console */
var socket = io.connect("/");
var user;

$(document).ready(function(){

  $('#user').keypress(function(e){
    if (e.keyCode == 13) {
      user = this.value;
      socket.emit('set username', user, function(data){
	console.log('emit set username', data);
      });
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('#message').keypress(function(e){
    if (e.keyCode == 13) {
      var target = $('#users').val();
      socket.emit('message', {
	source: user,
	target: target,
	message: $(this).val()
      });
      $(this).val("");
      e.stopPropagation();
      e.preventDefault();
    }
  });

  socket.on('welcome', function(data){
    $("#feedback").html("<span style='color: green'>"+data.message+"</span>");
    $('input#message').prop('disabled', false);
    $('input#user').prop('disabled', true);
    var options = "";
    for(var i = 0; i < data.current_users.length; i++) {
      options += '<option value="' + data.current_users[i] + '">' + data.current_users[i] + '</option>';
    }
    $('#users').append(options);
  });

  socket.on('joined', function(data){
    if (data.notify && data.user !== user) {
      $('#chat').append('<p class="notify">--> ' + data.user + ' joined</p>');
      $('#users').append('<option value="' + data.user + '">' + data.user + '</option>');
    }
  });

  socket.on('message', function(data){
    $('#chat').append('<p>' + data.source + ': ' + data.message + '</p>');
  });

  socket.on('error', function(data) {
    $("#feedback").html("<span style='color: red'>"+data.message+"</span>");
  });

});