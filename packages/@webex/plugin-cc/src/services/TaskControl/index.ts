import EventEmitter from 'events';
import {ICall, LINE_EVENTS, LocalMicrophoneStream, createMicrophoneStream} from '@webex/calling';
import {getErrorDetails} from '../core/Utils';
import WebCallingService from '../WebCallingService';
import {LoginOption} from '../../types';
import {CC_FILE} from '../../constants';
import {CC_EVENTS} from '../config/types';
import {WebSocketManager} from '../core/WebSocket/WebSocketManager';
import routingContact from './contact';
import {AgentContact, TASK_EVENTS, TaskResponse} from './types';

export default class TaskControl extends EventEmitter {
  private contact: ReturnType<typeof routingContact>;
  private call: ICall;
  private localAudioStream: LocalMicrophoneStream;
  private webCallingService: WebCallingService;
  private webSocketManager: WebSocketManager;
  private task: AgentContact;

  constructor(
    contact: ReturnType<typeof routingContact>,
    webSocketManager: WebSocketManager,
    webCallingService: WebCallingService
  ) {
    super();
    this.contact = contact;
    this.webCallingService = webCallingService;
    this.webSocketManager = webSocketManager;
    this.registerTaskListeners();
    this.registerIncomingCallEvent();
  }

  private registerIncomingCallEvent() {
    this.webCallingService.on(LINE_EVENTS.INCOMING_CALL, (call) => {
      if (this.task) {
        this.emit(TASK_EVENTS.TASK_INCOMING, this.task);
      }
      this.call = call;
    });
  }

  private registerTaskListeners() {
    // TODO: This event reception approach will be changed once state machine is implemented
    this.webSocketManager.on('message', (event) => {
      const payload = JSON.parse(event);
      switch (payload.data.type) {
        case CC_EVENTS.AGENT_CONTACT_RESERVED:
          this.task = payload.data;
          if (this.webCallingService.loginOption !== LoginOption.BROWSER) {
            this.emit(TASK_EVENTS.TASK_INCOMING, payload.data);
          } else if (this.call) {
            this.emit(TASK_EVENTS.TASK_INCOMING, payload.data);
          }
          break;
        case CC_EVENTS.AGENT_CONTACT_ASSIGNED:
          this.emit(TASK_EVENTS.TASK_ASSIGNED, payload.data);
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
   * @example
   * ```typescript
   * webex.cc.task.accept(taskId).then(()=>{}).catch(()=>{})
   * ```
   */
  public async accept(taskId: string): Promise<TaskResponse> {
    try {
      if (this.webCallingService.loginOption === LoginOption.BROWSER) {
        // @ts-ignore
        this.localAudioStream = await createMicrophoneStream({audio: true});
        this.webCallingService.answerCall(this.localAudioStream, taskId);

        return Promise.resolve(); // TODO: Update this with sending the task object received in AgentContactAssigned
      }

      // TODO: Invoke the accept API from services layer. This is going to be used in Outbound Dialer scenario
      return this.contact.accept({interactionId: taskId});
    } catch (error) {
      throw getErrorDetails(error, 'accept', CC_FILE);
    }
  }

  /**
   * This is used for the incoming task decline by agent.
   * @param data
   * @returns Promise<void>
   * @throws Error
   *  * ```typescript
   * webex.cc.task.decline(taskId).then(()=>{}).catch(()=>{})
   * ```
   */
  public async decline(taskId: string): Promise<TaskResponse> {
    try {
      this.webCallingService.declinecall(taskId);

      return Promise.resolve();
    } catch (error) {
      throw getErrorDetails(error, 'decline', CC_FILE);
    }
  }

  // TODO: Hold/resume, recording pause/resume, consult and transfer public methods to be implemented here
}
