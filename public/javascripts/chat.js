/* global io, $, console */
var socket    = io.connect("/");
var username  = null;
var signed_in = false;

$(document).ready(function(){

  feedback("Welcome to the Chat!", "info");
  check_fields();

  // Login
  $("#signin").click(function(){
    if (!signed_in) {
      var nickname = $('#user').val();
      if (nickname == "") {
	feedback('Please, type your nickname.', 'danger');
	check_fields();
      } else {
	socket.emit('user_sign_in', {username: $('#user').val()});
      }
    } else {
      feedback('You already is signed in as "' + username + '"', 'danger');
      check_fields();
    }
  });

  $('#user').keypress(function(e){
    if (e.keyCode == 13) {
      $("#signin").trigger('click');
    }
  });

  socket.on('sign_in_success', function(data){
    username  = data.username;
    signed_in = true;

    feedback(data.message, "success");
    var options = "";
    for(var i = 0; i < data.current_users.length; i++) {
      options += '<option value="' + data.current_users[i] + '">' + data.current_users[i] + '</option>';
    }
    $('#users').append(options);
    check_fields();
  });

  socket.on('user_signed_in', function(data){
    if (signed_in) {
      $('#chat').append('<p class="join">>>> ' + data.username + ' joined</p>');
      $('#users').append('<option class="user" value="' + data.username + '">' + data.username + '</option>');
    }
  });

  // Logout
  $('#signout').click(function(e){
    if (signed_in) {
      socket.emit('user_sign_out');
    } else {
      feedback('You are not logged in.\n\n Please type your "nickname" and hit <Enter>', 'danger');
      check_fields();
    }
  });
  
  socket.on('sign_out_success', function(){
    username  = null;
    signed_in = false;

    feedback("You left the chat", "success");
    $('select#users').html('<option value="all">All</option>');
    $('#user').val('');
    $('#chat').empty();
    check_fields();
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
      $('#send').trigger("click");
    }
  });

  $('#send').click(function(e){
    var target  = $('#users').val();
    var message = $('#message').val();
    if (message != "")  {
      socket.emit('send_message', { target:  target, message: message });
      $("#message").val("").focus();
      if ( target != 'all' ) {
	$('#chat').append("<p class='private'>" + username + ": " + message + "</p>");
      }
    } else {
      feedback('Please, type your message.', 'danger');      
      $("#message").focus();
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
    feedback(data.message, "danger");
  });

  function check_fields() {
    $("#user").prop("disabled", signed_in);
    $("#signin").prop("disabled", signed_in);

    $("#users").prop("disabled", !signed_in);
    $("#signout").prop("disabled", !signed_in);
    $("#message").prop("disabled", !signed_in);
    $("#send").prop("disabled", !signed_in);

    if (signed_in) {
      $("#message").focus();
    } else {
      $("#user").focus();
    }

  }

  function feedback(message, type) {
    var element = '<div class="alert alert-dismissable alert-'+type+'">' +
                  '  <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' +
                     message +
                  '</div>';
    $("#feedback").show().html(element).fadeOut(2500, function(){
      $("#feedback").hide().html("");
    });
  }

});

