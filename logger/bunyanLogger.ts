import bunyan, { LogLevel } from 'bunyan';
import moment from 'moment';

const env = process.env.NODE_ENV || 'development';

const loglevels: Record<string, LogLevel> = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  VERBOSE: 'trace',
  DEBUG: 'debug',
  SILLY: 'trace',
};

interface RequestInfo {
  functionName?: string;
  API_URL?: string;
  requestObj?: any;
  response?: any;
}

function Ec_Service_call(req: RequestInfo) {
  return {
    v2_function: req.functionName || 'V2BackEnd',
    ex_api_url: req.API_URL || '',
    ex_api_payload: req.requestObj || '',
    ex_api_response: req.response || '',
    log_time: moment().format('MMMM Do YYYY h:mm:ss a'),
  };
}

const logger = bunyan.createLogger({
  name: 'Backend',
  application: 'log',
  app_env: env,
  serializers: {
    Ex_serviceErr_call: Ec_Service_call,
  },
  streams: [
    {
      level: loglevels.DEBUG,
      stream: process.stdout,
    },
  ],
});

export default logger;
