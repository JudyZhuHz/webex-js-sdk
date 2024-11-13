import * as Err from './Err';
import {WebexRequestPayload} from '../../types';
import {Failure} from './GlobalTypes';
import LoggerProxy from '../../logger-proxy';

const getCommonErrorDetails = (errObj: WebexRequestPayload) => {
  return {
    trackingId: errObj?.headers?.trackingid || errObj?.headers?.TrackingID,
    msg: errObj?.body,
  };
};

export const getErrorDetails = (error: any, methodName: string) => {
  const failure = error.details as Failure;
  LoggerProxy.logger.error(`${methodName} failed with trackingId: ${failure?.trackingId}`);

  return new Error(failure?.data?.reason ?? `Error while performing ${methodName}`);
};

export const createErrDetailsObject = (errObj: WebexRequestPayload) => {
  const details = getCommonErrorDetails(errObj);

  return new Err.Details('Service.reqs.generic.failure', details);
};
