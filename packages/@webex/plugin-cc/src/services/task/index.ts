import {LocalMicrophoneStream} from '@webex/calling';
import {getErrorDetails} from '../core/Utils';
import {LoginOption} from '../../types';
import {CC_FILE} from '../../constants';
import routingContact from './contact';
import {ITask, TaskId, TaskResponse, TaskData} from './types';
import WebCallingService from '../WebCallingService';

export default class Task implements ITask {
  private contact: ReturnType<typeof routingContact>;
  private localAudioStream: LocalMicrophoneStream;
  private webCallingService: WebCallingService;
  public data: TaskData;

  constructor(
    contact: ReturnType<typeof routingContact>,
    webCallingService: WebCallingService,
    data: TaskData
  ) {
    this.contact = contact;
    this.data = data;
    this.webCallingService = webCallingService;
  }

  /**
   * This is used for incoming task accept by agent.
   *
   * @param taskId - Unique Id to identify each task
   *
   * @returns Promise<TaskResponse>
   * @throws Error
   * @example
   * ```typescript
   * task.accept(taskId).then(()=>{}).catch(()=>{})
   * ```
   */
  public async accept(taskId: TaskId): Promise<TaskResponse> {
    try {
      if (this.webCallingService.loginOption === LoginOption.BROWSER) {
        const constraints = {
          audio: true,
        };

        const localStream = await navigator.mediaDevices.getUserMedia(constraints);
        const audioTrack = localStream.getAudioTracks()[0];
        this.localAudioStream = new LocalMicrophoneStream(new MediaStream([audioTrack]));
        this.webCallingService.answerCall(this.localAudioStream, taskId);

        return Promise.resolve(); // TODO: Update this with sending the task object received in AgentContactAssigned
      }

      // TODO: Invoke the accept API from services layer. This is going to be used in Outbound Dialer scenario
      return this.contact.accept({interactionId: taskId});
    } catch (error) {
      const {error: detailedError} = getErrorDetails(error, 'accept', CC_FILE);
      throw detailedError;
    }
  }

  /**
   * This is used for the incoming task decline by agent.
   *
   * @param taskId - Unique Id to identify each task
   *
   * @returns Promise<TaskResponse>
   * @throws Error
   * ```typescript
   * task.decline(taskId).then(()=>{}).catch(()=>{})
   * ```
   */
  public async decline(taskId: TaskId): Promise<TaskResponse> {
    try {
      this.webCallingService.declineCall(taskId);

      return Promise.resolve();
    } catch (error) {
      const {error: detailedError} = getErrorDetails(error, 'decline', CC_FILE);
      throw detailedError;
    }
  }

  // TODO: Hold/resume, recording pause/resume, consult and transfer public methods to be implemented here
}
