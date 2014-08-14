var Component = require('../../lib/component.js');
var rewire = require("rewire");

describe("Components", function() {

  var component, htmldocDom, content, fullHtml;

  beforeEach(function() {

    htmldocDom = '- title: Typography\n' +
                    'group: Theme';
    content = '<h1>Test</h1>';
    fullHtml = '<div class="test"><h1>Test</h1></div>';

  });

  it("should construct correctly", function() {
    component = new Component(content, htmldocDom, 'components', '', fullHtml);

    expect(component instanceof Component).toBeTruthy();
  });

  it("should have correct defaults", function() {
    component = new Component(content, htmldocDom, 'components', '', fullHtml);

    expect(component.markup).toBeTruthy();
    expect(component.external).toBeFalsy();
    expect(component.type).toBe('component');

  });

  it("should support any user defined fields", function() {

    htmldocDom = '- title: Typography\n' +
      'group: Theme\n' +
      'myfield1: field1\n' +
      'myfield2: field2\n';

    component = new Component(content, htmldocDom, 'components', '', fullHtml);

    expect(component.myfield1).toBe('field1');
    expect(component.myfield2).toBe('field2');

  });


  it("should not validate if 'title' is not set", function() {
    htmldocDom = '- group: Theme';

    component = new Component(content, htmldocDom, 'components', '', fullHtml);

    expect(function() {
      component.validate();
    }).toThrow();
  });

  it("should not validate if 'group' is not set", function() {
    htmldocDom = '- title: Test';

    component = new Component(content, htmldocDom, 'components', '', fullHtml);

    expect(function() {
      component.validate();
    }).toThrow();
  });

  it("should get the 'group' field from the constructor if it is not defined in the comment", function() {
    component = new Component(content,  '- title: Test', 'components', 'the group', fullHtml);
    expect(component.group).toBe('the group');
  });

  it("Should have the correct filename", function() {
    component = new Component(content,  '- title: my test', 'components', 'my group', fullHtml);
    expect(component.getFilename()).toBe("components-my-group-my-test.html");
  });

  it("Should have the correct filename for external components", function() {
    component = new Component(content,  '- title: my test', 'components', 'my group', fullHtml);
    expect(component.getExternalFilename()).toBe("components-my-group-my-test-external.html");
  });

  it("Should grab content from external http source", function() {

    Component = rewire('../../lib/component.js');
    Component.__set__("request",  function() {
      return {
        statusCode: 200,
        body: 'Test Response'
      }
    });

    htmldocDom = '- title: Typography\n' +
      'group: Theme\n' +
      'spec: https://github.com/';

    component = new Component(content,  htmldocDom, 'components', 'my group', fullHtml);

    expect(component.spec).toBe('Test Response');
  });

  it("Should throw an error if it cannot get content from external http source", function() {

    Component = rewire('../../lib/component.js');
    Component.__set__("request",  function() {
      return {
        statusCode: 404
      }
    });

    htmldocDom = '- title: Typography\n' +
      'group: Theme\n' +
      'spec: https://github.com/';

    expect(function() {
      component = new Component(content,  htmldocDom, 'components', 'my group', fullHtml);
    }).toThrow();
  });

  it("Should grab content from file", function() {

    htmldocDom = '- title: Typography\n' +
      'group: Theme\n' +
      'spec: file://tests/fixtures/external-sources/test-1.txt';

    component = new Component(content,  htmldocDom, 'components', 'my group', fullHtml);

    expect(component.spec).toBe('This is an external source of content.');
  });

  it("Should throw an error if it cannot get content from external file", function() {

    htmldocDom = '- title: Typography\n' +
      'group: Theme\n' +
      'spec: file://file-does-not-exist.txt';

    expect(function() {
      component = new Component(content,  htmldocDom, 'components', 'my group', fullHtml);
    }).toThrow("Error: Could not fetch external content from file-does-not-exist.txt\n" +
      "<h1>Test</h1>\n" +
      "");
  });

});

