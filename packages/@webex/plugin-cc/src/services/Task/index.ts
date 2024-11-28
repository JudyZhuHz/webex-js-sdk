import EventEmitter from 'events';
import {ICall, LINE_EVENTS, LocalMicrophoneStream, createMicrophoneStream} from '@webex/calling';
import Services from '..';
import {getErrorDetails} from '../core/Utils';
import WebCallingService from '../WebCallingService';
import {LoginOption} from '../../types';
import {CC_FILE} from '../../constants';
import {CC_EVENTS} from '../config/types';

export default class Task extends EventEmitter {
  private localAudioStream: LocalMicrophoneStream;
  private services: Services; // This will be used later for invoking Contact APIs
  private webCallingService: WebCallingService;
  private taskPayload: any;
  private call: ICall;

  constructor(services: Services, webCallingService: WebCallingService) {
    super();
    this.services = services;
    this.webCallingService = webCallingService;
    this.registerTaskListeners();
    this.registerCallingEvent();
  }

  private registerCallingEvent() {
    this.webCallingService.on(LINE_EVENTS.INCOMING_CALL, (call) => {
      if (this.taskPayload) {
        this.emit('task:incoming', this.taskPayload);
      } else {
        this.call = call;
      }
    });
  }

  private registerTaskListeners() {
    // TODO: This event reception approach will be changed once state machine is implemented
    this.services.webSocketManager.on('message', (event) => {
      const payload = JSON.parse(event);
      switch (payload.data.type) {
        case CC_EVENTS.AGENT_CONTACT_RESERVED:
          this.taskPayload = payload.data;
          if (this.webCallingService.loginOption !== LoginOption.BROWSER) {
            this.emit('task:incoming', payload.data);
          } else if (this.call) {
            this.emit('task:incoming', payload.data);
          }
          break;
        case CC_EVENTS.AGENT_CONTACT_ASSIGNED:
          this.emit('task:assigned', payload.data);
          break;
        default:
          break;
      }
    });
  }

  /**
   * This is used for incoming task accept by agent.
   * @param data
   * @returns Promise<void>
   * @throws Error
   */
  public async accept(taskId: string): Promise<void> {
    try {
      if (this.webCallingService.loginOption === LoginOption.BROWSER) {
        // @ts-ignore
        this.localAudioStream = await createMicrophoneStream({audio: true});
        this.webCallingService.answerCall(this.localAudioStream, taskId);
      } else {
        // TODO: Invoke the accept API from services layer. This is going to be used in Outbound Dialer scenario
        this.services.contact.accept({interactionId: taskId});
      }
    } catch (error) {
      throw getErrorDetails(error, 'accept', CC_FILE);
    }
  }

  /**
   * This is used for the incoming task decline by agent.
   * @param data
   * @returns Promise<void>
   * @throws Error
   */
  public async decline(taskId: string): Promise<void> {
    try {
      this.webCallingService.declinecall(taskId);
    } catch (error) {
      throw getErrorDetails(error, 'decline', CC_FILE);
    }
  }

  // TODO: Hold/resume, recording pause/resume, consult and transfer public methods to be implemented here
}
