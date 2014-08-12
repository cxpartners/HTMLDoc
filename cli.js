#!/usr/bin/env node

/*
 * NPM modules
 */
var program = require('commander');
var yaml = require("js-yaml");
var fs = require('fs-extra');
var _ = require("lodash");

/*
 * App modules
 */
var logger = require('./lib/utils/logger.js');
var htmlDoc = require('./lib/htmldoc.js');

/*
 * Config
 */
var packageJson = require('./package.json');


/**
 * Initialise
 */
(function() {

  var components = [];
  var config;

  program
    .version(packageJson.version)
    .option('-c, --config <file>', 'set the path to the config file. defaults to ./htmldoc.yaml')
    .option('-C, --commit', 'Commit generated files to a repo')
    .option('-p, --preview', 'Launch webserver to preview the styleguide')
    .option('-v, --verbose', 'Show additional log messages')
    .parse(process.argv);

  var configYaml = program.config || './htmldoc.yaml';

  logger.verbose = program.verbose || false;

  try {
    config = yaml.safeLoad(fs.readFileSync(configYaml, 'utf8'));
  } catch (e) {
    logger.log(e, logger.LOG_CRITICAL);
  }



  config = _.defaults(config, {
    'preview': program.preview,
    'use_git': program.commit
  });

  htmlDoc.generate(config, logger);

})();