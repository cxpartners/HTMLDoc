var express = require('express');
var app = express();
var path = require('path');
var cwd = process.cwd();

module.exports = function(emitter, logger) {
  emitter.on('complete', function(config) {

    app.use('/', express.static(path.join(cwd, config.publish)));

    var server = app.listen(config.port, function() {
      logger.log('Style guide available to preview on port ' + server.address().port, logger.LOG_INFO);
    });
  });
};