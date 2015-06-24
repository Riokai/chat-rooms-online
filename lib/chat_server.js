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


exports.listen = function( server ) {
  io = socket.listen( server );

  io.set( 'log level', 1 );

  io.sockets.on( 'connection', function( socket ) {
    guestNumber = assignGuestName( socket, guestNumber, nickNames, namesUsed );
    joinRoom( socket, 'Lobby' );

    handleMessageBroadcasting( socket, nickNames );
    handleNameChangeAttempts( socket, nickNames, namesUsed );
    handleRoomJoining( socket );

    socket.on( 'rooms', function() {
      socket.emit( 'rooms', io.sockets.manager.rooms );
    });

    handleClientDisconnection( socket, nickNames, namesUsed );

  });
};