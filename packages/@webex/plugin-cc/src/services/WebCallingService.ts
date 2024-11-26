import {
  createClient,
  ICall,
  ICallingClient,
  ILine,
  LINE_EVENTS,
  CallingClientConfig,
  LocalMicrophoneStream,
} from '@webex/calling';
import {WebexSDK} from '../types';
import {TIMEOUT_DURATION, WEB_CALLING_SERVICE_FILE} from '../constants';
import LoggerProxy from '../logger-proxy';

export default class WebCallingService {
  private callingClient: ICallingClient;
  private callingClientConfig: CallingClientConfig;
  private line: ILine;
  private call: ICall;
  private webex: WebexSDK;
  constructor(webex: WebexSDK, callingClientConfig: CallingClientConfig) {
    this.webex = webex;
    this.callingClientConfig = callingClientConfig;
  }

  public async registerWebCallingLine(): Promise<void> {
    this.callingClient = await createClient(this.webex as any, this.callingClientConfig);
    this.line = Object.values(this.callingClient.getLines())[0];

    this.line.on(LINE_EVENTS.UNREGISTERED, () => {
      LoggerProxy.log(`WxCC-SDK: Desktop unregistered successfully`, {
        module: WEB_CALLING_SERVICE_FILE,
        method: this.registerWebCallingLine.name,
      });
    });

    // Start listening for incoming calls
    this.line.on(LINE_EVENTS.INCOMING_CALL, (call: ICall) => {
      this.call = call;
    });

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebCallingService Registration timed out'));
      }, TIMEOUT_DURATION);

      this.line.on(LINE_EVENTS.REGISTERED, (deviceInfo: ILine) => {
        clearTimeout(timeout);
        LoggerProxy.log(
          `WxCC-SDK: Desktop registered successfully, mobiusDeviceId: ${deviceInfo.mobiusDeviceId}`,
          {module: WEB_CALLING_SERVICE_FILE, method: this.registerWebCallingLine.name}
        );
        resolve();
      });
      this.line.register();
    });
  }

  public async deregisterWebCallingLine() {
    this.line?.deregister();
  }

  public answerCall(localAudioStream: LocalMicrophoneStream, taskId: string) {
    if (this.call) {
      this.webex.logger.info(`[WebRtc]: Call answered: ${taskId}`);
      this.call.answer(localAudioStream);
    } else {
      this.webex.logger.log(`[WebRtc]: Cannot answer a non WebRtc Call: ${taskId}`);
    }
  }

  public muteCall(localAudioStream: LocalMicrophoneStream) {
    if (this.call) {
      this.webex.logger.info('[WebRtc]: Call mute|unmute requesting!');
      this.call.mute(localAudioStream);
    } else {
      this.webex.logger.log(`[WebRtc]: Cannot mute a non WebRtc Call`);
    }
  }

  public isCallMuted() {
    if (this.call) {
      return this.call.isMuted();
    }

    return false;
  }

  public declinecall(taskId: string) {
    if (this.call) {
      this.webex.logger.info(`[WebRtc]: Call end requested: ${taskId}`);
      this.call.end();
    } else {
      this.webex.logger.log(`[WebRtc]: Cannot mute a non WebRtc Call: ${taskId}`);
    }
  }
}
