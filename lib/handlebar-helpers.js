var util = require('util');

var handlebars = require("handlebars");
var marked = require('marked');
var beautify_html = require('js-beautify').html;

module.exports = function(config) {

  var renderer = new marked.Renderer();

  renderer.br = function(text) {
    return this.options.xhtml ? '<br/><br />' : '<br><br>';
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
  });

  handlebars.registerHelper('markdown', function (context, options) {
    return marked(context);
  });

  handlebars.registerHelper('log', function (obj, depth) {
    console.log(util.inspect(obj, {
      showHidden: false,
      depth:depth
    }));
  });

  handlebars.registerHelper('url', function (obj) {
    if ( obj.items ) {
      return obj.items[0].getGroupFilename();
    }
    else {
      return obj.getFilename();
    }
  });

  handlebars.registerHelper('url-external', function (obj) {
    return obj.getExternalFilename();
  });

  handlebars.registerHelper('modulo', function (index, val, options) {
    if ( (index+1) % val === 0 ) {
      return options.fn(this);
    }
  });

  handlebars.registerHelper('tidy', function (html) {
    return beautify_html(html, config.htmltidy);
  });

  return handlebars;
};
