import 'jsdom-global/register';
import {LocalMicrophoneStream} from '@webex/calling';
import {LoginOption} from '../../../../../src/types';
import {getErrorDetails} from '../../../../../src/services/core/Utils';
import { CC_FILE } from '../../../../../src/constants';
import Task from '../../../../../src/services/task';

jest.mock('@webex/calling');
jest.mock('../../../../../src/services/core/Utils', () => ({
  getErrorDetails: jest.fn()
}));

describe('Task', () => {
  let task;
  let contactMock;
  let taskDataMock;
  let webCallingServiceMock;
  const taskId = 'taskId123';

  beforeEach(() => {
    contactMock = {
      accept: jest.fn().mockResolvedValue({}),
    };

    webCallingServiceMock = {
      loginOption: LoginOption.BROWSER,
      answerCall: jest.fn(),
      declinecall: jest.fn()
    };

      // Mock task data
      taskDataMock = {};

      // Create an instance of Task
      task = new Task(contactMock, webCallingServiceMock, taskDataMock);
  
      // Mock navigator.mediaDevices
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn(() =>
          Promise.resolve({
            getAudioTracks: jest.fn().mockReturnValue([''])
          })
        ),
      };
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should accept a task and answer call when using BROWSER login option', async () => {
    await task.accept(taskId);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(LocalMicrophoneStream).toHaveBeenCalledWith(expect.any(MediaStream));
    expect(webCallingServiceMock.answerCall).toHaveBeenCalledWith(expect.any(LocalMicrophoneStream), taskId);
  });

  it('should call accept API for Extension login option', async () => {
    webCallingServiceMock.loginOption = LoginOption.EXTENSION
    await task.accept(taskId);

    expect(contactMock.accept).toHaveBeenCalledWith({ interactionId: taskId });
  });

  it('should handle errors in accept method', async () => {
    const error = new Error('Test Error');
    navigator.mediaDevices.getUserMedia.mockRejectedValue(error);
    getErrorDetails.mockReturnValue(error);

    const acceptResponse = await task.accept(taskId);

    expect(webCallingServiceMock.answercall).toHaveBeenCalledWith(taskId)
    expect(acceptResponse).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'accept', CC_FILE);
  });

  it('should decline call using webCallingService', async () => {
    await task.decline(taskId);

    expect(webCallingServiceMock.declinecall).toHaveBeenCalledWith(taskId);
  });

  it('should handle errors in decline method', async () => {
    const error = new Error('Test Error');
    webCallingServiceMock.declinecall.mockImplementation(() => { throw error; });
    getErrorDetails.mockReturnValue(error);

    const declineResponse = await task.decline(taskId);

    expect(webCallingServiceMock.declinecall).toHaveBeenCalledWith(taskId)
    expect(declineResponse).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'decline', CC_FILE);
  }); 
});