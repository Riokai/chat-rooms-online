var divEscapedContentElement = function( message ) {
  return $('<div></div>').text( message );
};

var divSystemContentElement = function( message ) {
  return $('<div></div>').html('<i>' + message + '</i>');
};

var processUserInput = function( chatApp, socket ) {
  var message = $('#send-message').val();
  var systemMessage;

  if ( message.charAt( 0 ) === '/' ) {
    systemMessage = chatApp.processCommand( message );

    if ( systemMessage ) {
      $('#message').append( divSystemContentElement( systemMessage ) );
    } 
  } else {
    chatApp.sendMessage( chatApp.room, message );

    $('#messages').append( divEscapedContentElement( '自己：' +  message ) );
    $('#messages').scrollTop( $('#messages').prop( 'scrollHeight') );
  }

  $('#send-message').val('');

};