var server = require('../../lib/express.js');

describe("Preview Web Server", function() {

  var logger = require('../mocks/logger.mock.js');

  beforeEach(function() {
  });

  it("should run from port set in config", function(done) {
    new server({
      publish: './fixtures/',
      port: 4000
    }, logger, function(server) {
      expect(server.address().port).toBe(4000);
      server.close();
      done();
    });
  });


  it("should run from a free port if not specified in config", function(done) {
    new server({
      publish: './fixtures/'
    }, logger, function(server) {
      expect(server.address().port).toBeDefined();
      server.close();
      done();
    });
  });

});