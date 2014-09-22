var yaml = require("js-yaml");
var _ = require("lodash");
var slug = require("slug");
var request = require("request-sync");
var fs = require("fs");
var path = require("path");


/**
 *
 * @param string content
 * @param string htmldocDom
 * @param string category
 * @param string group
 * @param string fullhtml
 * @returns {Component}
 * @constructor
 */
function Component(content, htmldocDom, category, group, fullHtml) {

  this.htmldocDom = htmldocDom;
  this.htmldoc = this.parse(htmldocDom);

  /*
   * Allow content to be hidden
   */
  if ( _.indexOf(this.hide, 'content') === -1 ) {
    this.content = content;
  }

  /*
   * If the type is a template, then use all the markup
   */

  if ( this.type === 'template' ) {
    this.content = fullHtml;
  }

  /*
   * If inline is set, prepend it to the html
   */
  if ( this.inline ) {
    this.content = '<!-- ' + this.inline +  '-->' + this.content;
  }

  this.group = typeof this.group === 'undefined' ? group : this.group;

  this.category = category;

  return this;
}

/**
 * Validate the component
 * @returns {Component}
 */
Component.prototype.validate = function() {
  if ( !this.title ) {
    throw new ComponentError('No title set.', this.content);
  }
  if ( !this.group ) {
    throw new ComponentError('No group set.', this.content);
  }
  return this;
};

/**
 * Parse the block
 * @param body
 * @returns {{}}
 */
Component.prototype.parse = function(body) {

  var htmldoc;
  var value;
  var response;
  var filename;
  var cwd = process.cwd();

  body = body.substring(2);

  htmldoc = yaml.load(body);

  /*
   * Defaults
   */
  htmldoc = _.defaults(htmldoc, {
    markup: true,
    external: false,
    type: 'component',
    hide: []
  });

  /*
   * Add HTMLDoc values to the component
   */
  for (var key in htmldoc) {
    value = htmldoc[key];

    /*
     * Load from external source
     */
    if ( value.external ) {

      if ( value.external.substring(0, 7) === 'http://' || value.external.substring(0, 8) === 'https://' ) {
        value = requestFollow(value.external);
      }
      else if ( value.external.substring(0, 7) === 'file://') {
        filename = path.resolve(cwd, value.external.substring(7));

        try {
          response = fs.readFileSync(filename);
        }
        catch ( e ) {
          throw new ComponentError('Could not fetch external content from ' + path.relative(cwd, filename), this.content);
        }

        value = response.toString();
      }
    }

    /*
     * Only add if the field isn't hidden using the 'hide' value
     */
    if ( _.indexOf(htmldoc.hide, key) === -1 ) {
      this[key] = value;
    }
  }

  return htmldoc;
};

/**
 * Follow 302 http requests
 *
 * @param uri
 * @returns {*}
 */
var requestFollow = function(uri) {

  var response = request(uri);

  switch ( response.statusCode ) {
    case 302:
      return requestFollow(response.headers.location);
      break;

    case 200:
      return response.body;
      break;

    default:
      throw new ComponentError('Could not fetch external content from ' + uri, this.content);
  }
}

/**
 * Get the external filename
 * @returns {string}
 */
Component.prototype.getExternalFilename = function() {
  return this.getFilename({
    suffix: '-external'
  });
};

/**
 * Get the filename of the generated html page
 * @param opts
 * @returns {string}
 */
Component.prototype.getFilename = function() {

  var opts = arguments[0] || {};

  _.defaults(opts, {
    suffix: ''
  });

  return slug(this.category + ' ' + this.group + ' ' + this.title).toLowerCase() + opts.suffix + '.html';
};

/**
 * Get the filename of the generated group html page
 * @param opts
 * @returns {string}
 */
Component.prototype.getGroupFilename = function() {

  var opts = arguments[0] || {};

  _.defaults(opts, {
    suffix: ''
  });

  return slug(this.category + ' ' + this.group).toLowerCase() + opts.suffix + '.html';
};

/**
 * Component Exception
 *
 * @param message
 * @param htmldocDom
 * @returns {string}
 * @constructor
 */
function ComponentError(message, content) {
  this.name = "ComponentError";
  this.message = "Error: " + message + "\n" + content + "\n";
}

ComponentError.prototype = Error.prototype;
ComponentError.prototype.constructor = ComponentError;

module.exports = Component;