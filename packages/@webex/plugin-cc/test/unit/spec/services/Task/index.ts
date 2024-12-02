import 'jsdom-global/register';
import {LocalMicrophoneStream} from '@webex/calling';
import {LoginOption} from '../../../../../src/types';
import { CC_FILE } from '../../../../../src/constants';
import Task from '../../../../../src/services/task';
import { getErrorDetails } from '../../../../../src/services/core/Utils';

jest.mock('@webex/calling');

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
      declineCall: jest.fn()
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
    const error = {
      details: {
        trackingId: '1234',
        data: {
          reason: 'Error while performing accept',
        },
      },
    };

    webCallingServiceMock.answerCall.mockImplementation(() => { throw error; });

    const acceptResponse = await task.accept(taskId);

    expect(webCallingServiceMock.answerCall).toHaveBeenCalledWith(taskId)
    expect(acceptResponse).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'accept', CC_FILE);
  });

  it('should decline call using webCallingService', async () => {
    await task.decline(taskId);

    expect(webCallingServiceMock.declineCall).toHaveBeenCalledWith(taskId);
  });

  it('should handle errors in decline method', async () => {
    const error = {
      details: {
        trackingId: '1234',
        data: {
          reason: 'Error while performing decline',
        },
      },
    };

    webCallingServiceMock.declineCall.mockImplementation(() => { throw error; });

    const declineResponse = await task.decline(taskId);

    expect(webCallingServiceMock.declineCall).toHaveBeenCalledWith(taskId)
    expect(declineResponse).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'decline', CC_FILE);
  }); 
});