var fs = require('fs');
var util = require('util');

var rewire = require('rewire');
var _ = require('lodash')

var app = rewire('../../lib/htmldoc.js');
var logger;

describe("HTMLDoc", function() {

  beforeEach(function() {
    logger = require('../mocks/logger.mock.js');
    app.__set__('logger', logger);
  });

  describe("Components", function() {

    var components;

    it("should find components in source files", function() {

      components = app.getComponents([{
          category: 'test',
          files: ['tests/fixtures/components/file-1.html']
      }]);

      expect(components.length).toBe(1);

      components = app.getComponents([{
          category: 'test',
          files: ['tests/fixtures/components/file-2.html']
      }]);

      expect(components.length).toBe(2);

      components = app.getComponents([{
        category: 'test',
        files: ['tests/fixtures/components/file-{1,2}.html']
      }]);

      expect(components.length).toBe(3);

    });


    it("should log an error if format incorrect", function() {

      components = app.getComponents([{
        category: 'test',
        files: ['tests/fixtures/components/file-3.html']
      }]);

      // @todo refactor using `.calls.mostRecent()`
      expect(logger.log.mostRecentCall.args[0]).toContain("ComponentError: Error: No title set.");
    });



  });




});