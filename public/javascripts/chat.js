/* global io, $, console */
var socket    = io.connect("/");
var username  = null;
var signed_in = false;

$(document).ready(function(){

  // Login
  $('#user').keypress(function(e){
    if (e.keyCode == 13) {
      socket.emit('user_sign_in', {username: $(this).val()});
    }
  });

  socket.on('sign_in_success', function(data){
    username  = data.username;
    signed_in = true;

    $("#feedback").html("<span style='color: green'>" + data.message + "</span>");
    $('input#message').prop('disabled', false);
    $('input#user').prop('disabled', true);
    var options = "";
    for(var i = 0; i < data.current_users.length; i++) {
      options += '<option value="' + data.current_users[i] + '">' + data.current_users[i] + '</option>';
    }
    $('#users').append(options);
  });

  socket.on('user_signed_in', function(data){
    if (signed_in) {
      $('#chat').append('<p class="join">>>> ' + data.username + ' joined</p>');
      $('#users').append('<option class="user" value="' + data.username + '">' + data.username + '</option>');
    }
  });

  // Logout
  $('#exit').click(function(e){
    socket.emit('user_sign_out');
  });
  
  socket.on('sign_out_success', function(){
    username  = null;
    signed_in = false;

    $("#feedback").html("<span style='color: green'>You left the chat</span>");
    $('input#message').prop('disabled', true);
    $('input#user').prop('disabled', false);
    $('select#users').html('<option value="all">All</option>');
    $('select#users').attr('disabled', false);
  });

  socket.on('user_signed_out', function(data){
    if (signed_in) {
      $('#chat').append("<p class='left'><<< " + data.username + " left the chat</p>");
      $("select#users option[value='" + data.username + "']").remove();
    }
  });

  // Message
  $('#message').keypress(function(e){
    if (e.keyCode == 13) {
      var target  = $('#users').val();
      var message = $(this).val();
      socket.emit('send_message', { target:  target, message: message });
      $(this).val("");
      if ( target != 'all' ) {
	$('#chat').append("<p class='private'>" + username + ": " + message + "</p>");
      }
      e.stopPropagation();
      e.preventDefault();
    }
  });

  socket.on('receipt_private_message', function(data){
    if (signed_in) {
      $('#chat').append("<p class='private'>" + data.username + ": " + data.message + "</p>");
    }
  });

  socket.on('receipt_public_message', function(data){
    if (signed_in) {
      $('#chat').append("<p class='public'>" + data.username + ": " + data.message + "</p>");
    }
  });

  // System
  socket.on('error', function(data) {
    $("#feedback").html("<span style='color: red'>" + data.message + "</span>");
  });

});