var path = require("path");
var cwd = process.cwd();

var ee = require('event-emitter');
var fs = require('fs-extra');
var git = require("gift");
var Q = require('q');

module.exports = function(emitter, logger) {

  var config = {};

  /**
   * Initialise
   */
  var init = function() {

    var self = this;

    this.logger = logger;

    emitter.on('complete', function(config) {

      self.config = config;

      fs.exists(path.resolve(config.git.dir, './.git'), function(exists) {
        sync(exists).then(function(repo) {
          update(repo);
          fs.copySync(path.join(cwd, self.config.git.ignore), path.join(cwd, self.config.git.dir, '.gitignore'));
        }, function(err) {
          self.logger.log(err, self.logger.LOG_ERROR);
        });
      });
    });
  };

  /**
   * Sync with the origin
   *
   * @param exists
   * @returns {promise|Q.promise}
   */
  var sync = function(exists) {

    var deferred = Q.defer();
    var config = this.config;

    if ( !exists ) {
      git.clone(config.git.repo, config.git.dir, function(err, repo) {
        if ( err ) deferred.reject(err);
        deferred.resolve(repo);
      });
    }
    else {
      repo = git(path.resolve(config.git.dir));

      repo.current_commit(function(err, commit) {

        if ( typeof commit !== 'undefined' ) {
          repo.sync('origin', config.git.branch, function(err) {
            if ( err ) {
              deferred.reject(err);
            }
            deferred.resolve(repo);
          });
        }
        else {
          deferred.resolve(repo);
        }
      });
    }

    return deferred.promise;
  };

  /**
   * Update if required.
   *
   * @param repo
   */
  var update = function(repo) {

    var self = this;
    var deferred = Q.defer();

    fs.copy(path.join(cwd, this.config.publish), path.join(cwd, this.config.git.dir), function (err) {

      if ( err ) deferred.reject(response);

      repo.add('', {'all': true}, function(err, response) {
        if ( err ) deferred.reject(response);

        deferred.notify("Added files...");

        repo.commit(self.config.git['default-message'], {}, function(err, response) {
          if ( err ) deferred.reject(response);

          deferred.notify("Committed files...");

          repo.remote_push('origin master', function(err) {
            if ( err ) deferred.reject(response);

            deferred.notify("Pushed files...");

            repo.current_commit(function(err, commit) {
              deferred.notify("Commit id: " + commit.id);
              deferred.resolve();
            });
          });
        });
      });
    });

    deferred.promise.then(function(repo) {
      self.logger.log("All done.", self.logger.LOG_SUCCESS);
    }, function(error) {
      self.logger.log(error, self.logger.LOG_ERROR);
    }, function (progress) {
      self.logger.log(progress, self.logger.LOG_INFO);
    });
  };

  return init();
};

