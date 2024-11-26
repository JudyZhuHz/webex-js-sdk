import {LocalMicrophoneStream, createMicrophoneStream} from '@webex/calling';
import Services from '..';
import {getErrorDetails} from '../core/Utils';
import WebCallingService from '../WebCallingService';
import {LoginOption} from '../../types';

export default class Task {
  private localAudioStream: LocalMicrophoneStream;
  private services: Services; // This will be used later for invoking Contact APIs
  private webCallingService: WebCallingService;

  constructor(services: Services, webCallingService: WebCallingService) {
    this.services = services;
    this.webCallingService = webCallingService;
  }

  /**
   * This is used for incoming task accept by agent.
   * @param data
   * @returns Promise<TaskAcceptResponse>
   * @throws Error
   */
  public async accept(loginOption: LoginOption, taskId: string): Promise<void> {
    try {
      if (loginOption === LoginOption.BROWSER) {
        this.localAudioStream = await createMicrophoneStream({audio: true});
        this.webCallingService.answerCall(this.localAudioStream, taskId);
      } else {
        // TODO: Invoke the accept API from services layer. This is going to be used in Outbound Dialer scenario
        this.services.contact.accept({interactionId: taskId});
      }
    } catch (error) {
      throw getErrorDetails(error, 'accept');
    }
  }

  /**
   * This is used for the incoming task decline by agent.
   * @param data
   * @returns Promise<TaskAcceptResponse>
   * @throws Error
   */
  public async decline(taskId: string): Promise<void> {
    try {
      this.webCallingService.declinecall(taskId);
    } catch (error) {
      throw getErrorDetails(error, 'decline');
    }
  }

  // TODO: Hold/resume, recording pause/resume, consult and transfer public methods to be implemented here
}
