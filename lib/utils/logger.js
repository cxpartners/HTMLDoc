var chalk = require("chalk");

var logger = {

  LOG_SUCCESS: 0,
  LOG_DEBUG: -1,
  LOG_INFO: -2,
  LOG_NOTICE: -3,
  LOG_ERROR: -4,
  LOG_CRITICAL: -5,

  verbose: false,

  log: function(msg, level) {
    switch ( level ) {
      case this.LOG_CRITICAL:
        console.log(chalk.red(msg));
        process.exit(1);
        break;
      case this.LOG_ERROR:
        console.log(chalk.red(msg));
        break;
      case this.LOG_DEBUG:
        if ( this.verbose ) {
          console.log(chalk.white(msg));
        }
        break;
      case this.LOG_INFO:
        console.log(chalk.white('> ') + chalk.white(msg));
        break;
      case this.LOG_NOTICE:
        console.log(chalk.yellow(msg));
        break;
      case this.LOG_SUCCESS:
        console.log(chalk.green(msg));
        break;
    }
  }
};

module.exports = logger;