var Chat = function ( socket ) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function( room, text ) {
  this.socket.emit( 'message', {
    room: room,
    text: text
  });
};

Chat.prototype.changeRoom = function ( room ) {
  this.socket.emit( 'join', {
    newRoom: room
  });
};

// 处理聊天命令
Chat.prototype.processCommand = function( command ) {
  var words = command.split(' ');
  var message = false;
  var room;
  var name;

  command = words[0]
                  .substring( 1, words[0].length )
                  .toLowerCase();

  // console.log(command);

  switch ( command ) {
    case 'join':
      words.shift();
      room = words.join(' ');
      // console.log(room);
      this.changeRoom( room );
      break;

    case 'nick':
      words.shift();
      name = words.join(' ');
      this.socket.emit( 'nameAttempt', name );
      break;

    default:
      message = '未识别的命令！';
      break;
  }

  return message;
};

var socket = io.connect();

$(document).ready( function() {
  var chatApp = new Chat( socket );

  // 显示更名尝试结果
  socket.on( 'nameResult', function( result ) {
    var message;

    if ( result.success ) {
      message = '更名成功，你现在的昵称为' + result.name + '.';
    } else {
      message = result.message;
    }

    $('#message').append( divSystemContentElement( message ) );
  });

  // 显示房间变更结果
  socket.on( 'joinResult', function( result ) {
    $('#room-list').append( divEscapedContentElement( result.room ) );
    $('#messages').append( divSystemContentElement( '加入房间' +　result.room ) );
  } );

  // 显示接收到的消息
  socket.on( 'message', function( message ) {
    console.log('message received');
    var newElement = $('<div></div>').text( message.text );
    $('#messages').append( newElement );
  });

  // 显示可用房间列表
  socket.on( 'rooms', function( rooms ) {
    $('#room-list').empty();

    for (var room in rooms) {
      room = room.substring( 1, room.length );

      if ( room !== '' ) {
        $('#room-list').append( divEscapedContentElement( room ) );
      }
    }
    // 点击房间名切换房间
    $('#room-list div').click( function() {
      chatApp.processCommand( '/join ' + $( this ).text() );

      $('#send-message').focus(); 
    } );

  } );

  // 定时请求可用房间列表
  setInterval( function() {
    socket.emit( 'rooms' );
  }, 1000);

  $('#send-message').focus();

  $('#send-button').click( function( e ) {
    e.preventDefault();

    processUserInput( chatApp, socket );

    $('#send-message').focus();

    return false;
  });

  // $('#send-button').click( function( e ) {
  //   e.preventDefault();

  //   console.log(111);
  // });

} );