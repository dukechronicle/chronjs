var util = require('util');
var winston = require('winston');
var Transport = winston.transports.Transport;
var Console = winston.transports.Console;


var CustomConsole = exports.CustomConsole = function (options) {
  Console.call(this, options);

  options = options || {};

  this.name      = 'custom_console';
  this.msgStringify = options.msgStringify || function (obj) {
      return obj;
  };
  this.metaStringify = options.metaStringify || function (obj) {
      return obj;
  };
};

//
// Inherit from `winston.transports.Console`.
//
util.inherits(CustomConsole, Console);

//
// Expose the name of this Transport on the prototype
//
CustomConsole.prototype.name = 'custom_console';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Overridden logging method exposed to Winston. Metadata is optional.
//
CustomConsole.prototype.log = function (level, msg, meta, callback) {
    if (typeof msg == "object") msg = this.msgStringify(msg);
    if (typeof meta == "object") meta = this.metaStringify(meta);
    Console.prototype.log(level, msg, meta, callback);
};

CustomConsole.prototype.logException = function (msg, meta, callback) {
    meta = "\n" + meta.stack.join("\n");
    Console.prototype.logException(msg, meta, callback);
};