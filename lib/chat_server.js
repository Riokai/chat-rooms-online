var socket = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// 分配昵称
var assignGuestName = function( socket, guestNumber, nickNames, nameUsed ) {
  var name = 'Guest' + guestNumber;

  nickNames[socket.io] = name;

  socket.emit( 'nameResult', {
    success: true,
    name: name
  } );

  namesUsed.push( name );

  return guestNumber + 1;
};

// 进入聊天室
var joinRoom = function( socket, room ) {
  var usersInRoom;

  socket.join( room );
  currentRoom[socket.id] = room;

  socket.emit( 'joinResult', { room: room });
  socket.broadcast.to( room ).emit( 'message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  usersInRoom = io.sockets.clients( room );

  if ( usersInRoom.length > 1 ) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';

    for ( var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;

      if ( userSocketId !== socket.id ) {
        if ( index > 0 ) {
          usersInRoomSummary += ', ';
        }

        usersInRoomSummary += nickNames[userSocketId];
      }
    }

    usersInRoomSummary += '.';

    socket.emit( 'message', { text: usersInRoomSummary });

  }
};

// 处理昵称变更请求
var handleNameChangeAttempts = function( socket, nickNames, namesUsed ) {
  socket.on( 'nameAttempt', function( name ) {

    if ( name.indexOf( 'Guest' ) === 0 ) {
      socket.emit( 'nameResult', {
        success: false,
        message: '自定义的昵称不能以Guest开头！'
      });
    } else {
      if ( namesUsed.indexOf( name ) === -1 ) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf( previousName );

        namesUsed.push( name );
        nickNames[socket.id] = name;

        delete namesUsed[previousNameIndex];

        socket.emit( 'nameResult' , {
          success: true,
          name: name
        });

        socket.broadcast.to( currentRoom[socket.id] ).emit( 'message', {
          text: previousName + '更名为' + name + '.'
        } );
      } else {
        socket.emit( 'nameResult', {
          success: false,
          message: '此用户名已被使用'
        });
      }
    }

  } );
};

// 发送聊天消息
var handleMessageBroadcasting = function( socket ) {
  socket.on( 'message', function( message ) {
    socket.broadcast.to( message.room ).emit( 'message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  } );
};

// 创建房间
var handleRoomJoining = function( socket ) {
  socket.on( 'join', function( room ) {
    socket.leave( currentRoom[socket.id] );
    joinRoom( socket, room.newRoom );
  });
};

// 断开连接
var handleClientDisconnection = function( socket ) {
  socket.on( 'disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);

    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
};


exports.listen = function( server ) {
  io = socket.listen( server );

  io.set( 'log level', 1 );

  io.sockets.on( 'connection', function( socket ) {
    guestNumber = assignGuestName( socket, guestNumber, nickNames, namesUsed );
    joinRoom( socket, 'Lobby' );

    handleNameChangeAttempts( socket, nickNames, namesUsed );
    // handleMessageBroadcasting( socket, nickNames );
    handleMessageBroadcasting( socket );
    handleRoomJoining( socket );

    socket.on( 'rooms', function() {
      socket.emit( 'rooms', io.sockets.manager.rooms );
    });

    handleClientDisconnection( socket, nickNames, namesUsed );

  });
};