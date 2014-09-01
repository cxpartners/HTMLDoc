var express = require('express');
var app = express();
var path = require('path');

module.exports = function(config, logger, callback) {

  var cwd = process.cwd();
  var port = config.port || 3000;

  app.use('/', express.static(path.join(cwd, config.publish)));

  startServer(config.port, app, function(server) {

    logger.log('Style guide available to preview on port ' + server.address().port, logger.LOG_INFO);

    if ( callback ) {
      callback(server);
    }
  });
};

var startServer = function(port, app, callback) {
  var server = app.listen(port, function() {
    callback(this);
  });

  server.on('error', function (err) {
    return startServer(port+1, app, callback);
  });
};