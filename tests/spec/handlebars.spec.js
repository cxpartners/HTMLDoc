var rewire = require("rewire");

describe("Custom Handlebar Helpers", function() {

  var handlebarHelpers = require("../../lib/handlebar-helpers.js");
  var handlebars;

  beforeEach(function() {
    handlebars = handlebarHelpers({});
  });

  describe("'markdown'", function() {
    it("should be registered", function() {
      expect(handlebars.helpers.markdown).toBeDefined();
    });
  });

  describe("'log'", function() {

    it("should be registered", function() {
      expect(handlebars.helpers.log).toBeDefined();
    });

    it("should call console.log", function() {
      spyOn(console, 'log');
      handlebars.helpers.log();
      expect(console.log).toHaveBeenCalled();
    });
  });


  describe("'modulo'", function() {

    var template;

    beforeEach(function() {
      template = handlebars.compile('{{#each items}}{{#modulo @index 4}}{{this}}{{/modulo}}{{/each}}');
    });

    it("should be registered", function() {
      expect(handlebars.helpers.modulo).toBeDefined();
    });

    it("should return 4 in a array of 4 elements when the array index is divided by 4", function() {
      template = handlebars.compile('{{#each items}}{{#modulo @index 4}}{{this}}{{/modulo}}{{/each}}');
      var output = template({
        items: [1,2,3,4]
      });
      expect(output).toBe('4');
    });

    it("should return 4 and 8 in a array of 8 elements when the array index is divided by 4", function() {
      template = handlebars.compile('{{#each items}}{{#modulo @index 4}}<p>{{this}}</p>{{/modulo}}{{/each}}');
      var output = template({
        items: [1,2,3,4,5,6,7,8]
      });
      expect(output).toBe('<p>4</p><p>8</p>');
    });

    it("should return nothing in a array of 0 elements", function() {
      template = handlebars.compile('{{#each items}}{{#modulo @index 4}}<p>{{this}}</p>{{/modulo}}{{/each}}');
      var output = template({
        items: []
      });
      expect(output).toBe('');
    });

  });

  describe("'beautify_html'", function() {

    var beautifyHtmlMock;
    var handlebarHelpers = rewire("../../lib/handlebar-helpers.js");
    var handlebars;

    beforeEach(function() {
      handlebars = handlebarHelpers({});
      beautifyHtmlMock = jasmine.createSpy('spy');
      handlebarHelpers.__set__("beautify_html",  beautifyHtmlMock);
    });

    it("should be registered", function() {
      expect(handlebars.helpers.tidy).toBeDefined();
    });

    it("should call beautify_html", function() {
      handlebars.helpers.tidy();
      expect(beautifyHtmlMock).toHaveBeenCalled();
    });
  });

  describe("'url'", function() {

    it("should be registered", function() {
      expect(handlebars.helpers.url).toBeDefined();
    });

    it("should call getFilename", function() {
      var obj = {
        getFilename: function() {}
      };

      spyOn(obj, 'getFilename');

      handlebars.helpers.url(obj);
      expect(obj.getFilename).toHaveBeenCalled();
    });
  });

  describe("'url-external'", function() {

    it("should be registered", function() {
      expect(handlebars.helpers['url-external']).toBeDefined();
    });

    it("should call getExternalFilename", function() {
      var obj = {
        getExternalFilename: function() {}
      };

      spyOn(obj, 'getExternalFilename');

      handlebars.helpers['url-external'](obj);
      expect(obj.getExternalFilename).toHaveBeenCalled();
    });
  });

});
