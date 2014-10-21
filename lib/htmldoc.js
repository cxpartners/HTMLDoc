/*
 * Core modules
 */
var path = require('path');
var util = require('util');


/*
 * NPM modules
 */
var glob = require("glob");
var fs = require('fs-extra');
var _ = require("lodash");
var cheerio = require("cheerio");
var handlebars = require("handlebars");
var traverse = require('traverse');
var marked = require('marked');
var chalk = require("chalk");
var string = require("string");
var ee = require('event-emitter');
var emitter = ee({});
var async = require('async');
var strftime = require('strftime');
var slug = require('slug');


/*
 * App modules
 */
var git = require('./git.js');
var express = require('./express.js');
var commentComponent = require('./component.js');
var hbsHelpers = require('./handlebar-helpers.js');

/*
 * Config
 */
var packageJson = require('../package.json');

var logger = {};

/*
 * Constants
 */
var EOL = require('os').EOL;


var cwd;

/**
 * Get components within the files
 * @param string[] srcFiles
 *   An array of globbing patterns
 * @returns {*}
 */
var getComponents = function(srcFiles, domMatching) {

  var components = [];
  var rawHtml;
  var elements;
  var $;
  var deduped;
  var files;

  srcFiles.forEach(function(categories, i) {

    categories.files.forEach(function(filePattern) {

      files = glob.sync(filePattern);

      files.forEach(function(file) {

        if ( fs.lstatSync(file).isDirectory() ) {
          return;
        }

        logger.log("Checking " + file, logger.LOG_DEBUG);

        rawHtml = fs.readFileSync(file, 'utf-8');

        /*
         * For all template comments, we need to ensure it is the only
         * comment on the page so that other components that make up
         * the template aren't replicated on their own pages.
         */
        if (rawHtml.match(/type: template/gm) ) {
          rawHtml = rawHtml.replace(/<!---[\s\S]*?-->/gim, function(match) {
            if ( !match.match(/type: template/gm) ) {
              return '';
            }
            else {
              return match;
            }
          });
        }

        elements = cheerio.parseHTML(rawHtml);
        $ = cheerio.load(rawHtml);

        function descend(elements) {

          _.each(elements, function(elem) {

            var content = '';
            var nextType;
            var noMatch;
            var hasClosingComment = false;

            if ( elem.type == 'comment' && elem.data.substring(0,1) == '-' && elem.data.substring(2,4) !== '//' ) {

              noMatch = $(elem).next().toString();

              /*
               * Match sibling element until the sibling changes type
               */
              switch ( domMatching ) {

                default:

                  var currentHtml = '';

                  try {
                    _.each($(elem).nextAll(), function(siblingElem) {
                      currentHtml += $(siblingElem).toString();

                      /*
                       * if there is a <!--- // --> before the end EOF or the next selector
                       * then the content is everything up to that point
                       */
                      if (  siblingElem.next &&  siblingElem.next.next && siblingElem.next.next.data == '- // ' ) {
                        hasClosingComment = true;

                        // break the loop
                        throw(currentHtml);
                      }
                    });
                  } catch ( _content ) {
                    content = _content;
                  }

                  if ( !hasClosingComment ) {
                    content = noMatch;
                  }

                  break;
              }

              var filename = path.basename(file, path.extname(file));

              try {
                logger.log("Found component in " + file, logger.LOG_NOTICE);

                components.push(new commentComponent(
                  content,
                  elem.data,
                  categories.category,
                  string(filename).humanize().s,
                  rawHtml)
                .validate());
              }
              catch ( e ) {
                logger.log(e.toString(), logger.LOG_ERROR);
              }
            }
            return descend(elem.children);
          });
        }

        descend(elements);

      });
    });
  });

  deduped = dedupe(components);

  return deduped;
};

/**
 * We want to combine components with the same title, merging
 * the content.
 */
var dedupe = function(components) {

  var duplicates = [];
  var index;

  var deduped = _.uniq(components, function(item) {
    return item.title + item.group;
  });

  duplicates = _.difference(components, deduped);

  _.each(duplicates, function(item) {

    index = _.findIndex(deduped, function(comp) {
      return comp.group == item.group && comp.title == item.title;
    });

    /*
     * When we find the duplicate, merge the content.
     */
    if ( index >= 0 ) {
      deduped[index].content += EOL + EOL + item.content;
    }

  });

  return deduped;
};

/**
 * Get the navigation object for a category.
 *
 * @param category
 * @returns {Array}
 */
var getNav = function(components, category) {

  var cols = [];

  var ordered = _(components)
    .groupBy(function(item, index) {
      return item.category;
    }).value();

  ordered = _(ordered[category])
    .groupBy(function(item, index) {
      return item.group;
    })
    .map(function(item, index) {
      return {length: item.length, group: index, items: item};
    })
    .sortBy(function(item) {
      return item.length;
    })
    .reverse()
    .value();

  return ordered;
};

/**
 * Set global data for templates
 * @param config
 * @returns {*}
 */
var getTemplateData = function(components, files, pages) {

  var items;
  var date = new Date();
  var link;
  var currentGroup;
  var templateData = {};

  pages = !pages ? [] : pages;

  templateData.nav = [];
  templateData.pages = [];

  _.each(files, function(category) {

    /*
     * Components are currently flat, i.e.
     *
     * {
     *   content: ...
     *   title: ...
     *   type: ...
     * },
     * {
     *   content: ...
     *   title: ...
     *   type: ...
     * }
     *
     */
    items = getNav(components, category.category);

    templateData.nav.push({
      category: category.category,
      items: items
    });
  });

  templateData.global = {
    date: strftime('%d %B %Y')
  };

  pages.forEach(function(page) {
    if ( page.index ) {
      return;
    }
    templateData.pages.push({
      'title': page.title,
      'link': ('page-' + slug(page.title) + '.html').toLowerCase()
    });
  });

  return templateData;

};


/**
 *
 * @param components
 * @returns {*|Array}
 */
var getGroups = function(components, groups) {

  var groupDefault = {};

  var componentsGrouped = _.groupBy(components, function(item, index) {
    return item.category + '-' + item.group;
  });

  var processedGroups = _.map(componentsGrouped, function(item, index) {

    index = item[0].group;

    groups[index] = typeof groups[index] === 'undefined' ? {} : groups[index];

    groupDefault = _.defaults(groups[index], {
      'label': index.charAt(0).toUpperCase() + index.slice(1),
      'id': index,
      'description': ''
    });

    return {
      components: item,
      group: groupDefault,
      category: item[0].category
    };
  });

  return processedGroups;
};

/**
 * Get a compiled Handlebars template.
 *
 * @param template
 * @param templatePath
 * @returns {*}
 */
var loadTemplate = function(template, templatePath) {

  var templatePath = path.join(cwd, templatePath, template);

  try {
    var templateFile = fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    logger.log("Could not find template '" + templatePath, logger.LOG_CRITICAL);
  }

  return handlebars.compile(templateFile);
};

/**
 * Generate component pages
 *
 * @param components
 * @param config
 */
var generateComponentPages = function(components, globalData, config, callback) {

  var templateFile;
  var template;
  var file;
  var templatePath;
  var groups = getGroups(components, config.groups);
  var from, to;

  var wrapperTemplate = loadTemplate('wrapper.hbs', config.templates);
  var bareWrapperTemplate = loadTemplate('wrapper-bare.hbs', config.templates);
  var externalWrapperTemplate = loadTemplate('wrapper-external.hbs', config.templates);
  var patternTemplate = loadTemplate('pattern.hbs', config.templates);
  var groupTemplate = loadTemplate('group.hbs', config.templates);

  logger.log("Found "+ components.length + " components...", logger.LOG_INFO);

  /*
   * Generate group templates
   */
  _.forEach(groups, function(group, index) {

    handlebars.registerPartial("body", groupTemplate({
      title: group.components[0].group,
      components: group.components,
      category: group.components[0].category
    }));

    file = path.join(cwd, config.publish, group.components[0].getGroupFilename());

    fs.outputFileSync(file, wrapperTemplate(globalData));

    logger.log("Generated group:     " + path.relative(cwd, file), logger.LOG_SUCCESS);

    _.forEach(group.components, function(component, index) {

      /*
       * Register it as a partial
       */
      handlebars.registerPartial("body", patternTemplate(component));

      /*
       * Add it to the wrapper
       */

      file = path.join(cwd, config.publish, component.getFilename());

      var content = component.type === 'component' ? globalData : component;

      fs.outputFileSync(file, wrapperTemplate(globalData));

      logger.log("Generated component: " + path.relative(cwd, file), logger.LOG_SUCCESS);


      if ( component.external ) {

        file = path.join(cwd, config.publish, component.getExternalFilename());

        if ( component.type == 'template' ) {
          fs.outputFileSync(file, bareWrapperTemplate(component));
        }
        else {
          fs.outputFileSync(file, externalWrapperTemplate(component));
        }

        logger.log("Generated " + path.relative(cwd, file), logger.LOG_SUCCESS);
      }
    });
  });

  async.parallel([
    function(callback) {
      fs.copy(path.join(cwd, config.templates, config.template_assets), path.join(cwd, config.publish, config.template_assets), callback);
    },
    function(callback){

      config.assets.forEach(function(asset) {

        from = path.join(cwd, asset.src);
        to = path.resolve(cwd, config.publish, asset.dest);

        logger.log("Copying project assets from " + from + " to " + to, logger.LOG_DEBUG);
        fs.copySync(from, to);

      });

      callback();
    }
  ], function() {
    callback();
  });
};

var generateStaticPage = function(page, globalData, config, callback) {

  var templateFile;
  var template;
  var content;
  var html;
  var file;

  if ( typeof page.src === 'undefined' ) {
    return;
  }

  /*
   * Get the content of the file
   */
  content = fs.readFileSync(path.join(cwd, page.src), 'utf8');

  /*
   * Get the page template
   */
  templatePath = path.join(cwd, config.templates + '/page.hbs');

  try {
    templateFile = fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    logger.log("Could not find template '" + templatePath + "'", logger.LOG_CRITICAL);
  }

  template = handlebars.compile(templateFile);
  html = template({
    content: marked(content)
  });

  handlebars.registerPartial("body", html);
  templateFile = fs.readFileSync(path.join(cwd, config.templates + '/wrapper.hbs'), 'utf8');
  template = handlebars.compile(templateFile);

  if ( page.index ) {
    file = path.join(cwd, config.publish, 'index.html');
  }
  else {
    file = path.join(cwd, config.publish, 'page-' + slug(page.title).toLowerCase() + '.html');
  }

  fs.outputFile(file, template(globalData), callback);
};

/**
 * Generate page pages
 *
 * @param config
 */
var generateStaticPages = function(globalData, config, callback) {

  if ( !config.pages ) {
    return this;
  }

  async.each(config.pages, function(page) {
    generateStaticPage(page, globalData, config, callback);
  }, function() {
    callback();
  });

};

/**
 *
 * @param _config
 * @param _logger
 */
var generate = function(config, _logger) {

  var components;
  var templateData;

  cwd = process.cwd();

  config = _.defaults(config, {
    use_groups: true,
    publish: 'publish',
    use_git: false,
    preview: false,
    port: 3000,
    groups: {}
  });

  logger = _logger;

  /*
   * Register handlebar helpers
   */
  hbsHelpers(config);

  fs.removeSync(config.publish);

  components = getComponents(config.files, config.dom_matching);

  templateData = getTemplateData(components, config.files, config.pages);

  async.parallel([
    function(callback) {
      generateComponentPages(components, templateData, config, callback);
    },
    function(callback) {
      generateStaticPages(templateData, config, callback);
    }
  ], function() {

    if ( config.use_git ) {
      git(emitter, logger);
    }

    if ( config.preview ) {
      express(config, logger);
    }

    emitter.emit('complete', config);
  });
};


/*
 * Expose an API
 */
module.exports = {
  generate: generate,
  getComponents: getComponents,
  generateComponents: generateComponentPages,
  getTemplateData: getTemplateData,
  generatePages: generateStaticPages
};