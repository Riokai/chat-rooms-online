var http = require('http');
var fs   = require('fs');
var path = require('path');
var mime = require('mime');

var chatServer = require('./lib/chat_server.js');

var cache = {};
var PORT = 8000;

// 请求的文件不存在时，发送404错误
var send404 = function( res ) {
  res.writeHead( 404, {
    'Content-Type': 'text/plain'
  });

  res.write( 'Error 404: resource not found.' );
  res.end();
};

// 提供文件数据服务
var sendFile = function( res, filePath, fileContents ) {
  res.writeHead( 200, {
    'Content-Type': mime.lookup( path.basename( filePath ))
  });

  res.end( fileContents );
};

// 提供静态文件服务
var serveStatic = function( res, cache, absPath ) {
  if ( cache[absPath] ) {
    sendFile( res, absPath, cache[ absPath ] );
  } else {
    fs.exists( absPath, function( exists ) {
      if ( exists ) {
        fs.readFile( absPath, function( err, data ) {
          if ( err ) {
            send404( res );
          } else {
            // cache[ absPath ] = data;
            sendFile( res, absPath, data );
          }
        } );
      } else {
        send404( res );
      }
    });
  }
};

// 创建HTTP服务器
var server = http.createServer( function( req, res) {
  var filePath = false;

  if ( req.url === '/' ) {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + req.url;
  }

  var absPath = './' + filePath;

  serveStatic( res, cache, absPath );
});

server.listen( PORT, function() {
  console.log( 'Server running on port ' + PORT);
});
// 启动Socket.io服务器
chatServer.listen( server );