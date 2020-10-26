'use strict';

const { LEVEL } = require('triple-beam');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, prettyPrint, colorize, printf, label, splat } = format;

const NS_PER_SEC = 1e9;

const buildTextFormat = (module) => {
  return combine(
    timestamp(),
    prettyPrint(),
    colorize(),
    splat(),
    format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label']
    }),
    label({ label: module }),
    printf(info => {
      return `${info.timestamp} |-${info.level} [${info.label}]: ${info.message}`;
    })
  );
};

const buildJsonFormat = (theLabel) => {
  return combine(
    timestamp(),
    splat(),
    format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label']
    }),
    label({ label: theLabel }),
    printf(info => {
      const [hrSeconds, hrNanoSecondsRemainder] = process.hrtime();
      const written_ts = hrSeconds * NS_PER_SEC + hrNanoSecondsRemainder;
      const toStdOut = {
        label: info.label,
        level: info[LEVEL], // this gets the non-colorized version of the string
        msg: info.message,
        written_ts,
        written_at: info.timestamp,
      };
      return JSON.stringify(toStdOut);
    }));
};

function logger(theLabel = '', theTransports = [new transports.Console()]) {
  const isTextFormat = /*config('logger:format') == */'text';
  const theFormat = isTextFormat ? buildTextFormat(theLabel) : buildJsonFormat(theLabel);

  return createLogger({
    exitOnError: false,
    level: /*config('logger:level') ||*/ 'debug',
    format: theFormat,
    transports: theTransports,
  });
}

module.exports = logger;
