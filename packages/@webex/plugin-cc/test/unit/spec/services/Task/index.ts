import EventEmitter from 'events';
import Task from '../../../../../src/services/Task'; // Adjust the import path as necessary
import {LINE_EVENTS, createMicrophoneStream} from '@webex/calling';
import {CC_EVENTS} from '../../../../../src/services/config/types';
import {LoginOption} from '../../../../../src/types';
import {getErrorDetails} from '../../../../../src/services/core/Utils';

jest.mock('@webex/calling', () => ({
  LINE_EVENTS: {
    INCOMING_CALL: 'incoming_call'
  },
  createMicrophoneStream: jest.fn()
}));

jest.mock('../../../../../src/services/core/Utils', () => ({
  getErrorDetails: jest.fn()
}));

describe('Task', () => {
  let task;
  let servicesMock;
  let webCallingServiceMock;

  beforeEach(() => {
    servicesMock = {
      webSocketManager: new EventEmitter(),
      contact: {
        accept: jest.fn()
      }
    };

    webCallingServiceMock = {
      on: jest.fn(),
      answerCall: jest.fn(),
      declinecall: jest.fn()
    };

    task = new Task(servicesMock, webCallingServiceMock);
  });

  test('should set up listeners correctly', () => {
    servicesMock.webSocketManager.emit('message', { type: CC_EVENTS.AGENT_CONTACT_RESERVED });

    expect(webCallingServiceMock.on).toHaveBeenCalledWith(LINE_EVENTS.INCOMING_CALL, expect.any(Function));
  });

  test('should emit task:assigned when AGENT_CONTACT_ASSIGNED event is received', () => {
    const spy = jest.spyOn(task, 'emit');
    servicesMock.webSocketManager.emit('message', { type: CC_EVENTS.AGENT_CONTACT_ASSIGNED });

    expect(spy).toHaveBeenCalledWith('task:assigned');
  });

  test('should accept call using microphone stream for BROWSER login option', async () => {
    const mockStream = {};
    createMicrophoneStream.mockResolvedValue(mockStream);

    await task.accept(LoginOption.BROWSER, 'task-id');

    expect(createMicrophoneStream).toHaveBeenCalledWith({ audio: true });
    expect(webCallingServiceMock.answerCall).toHaveBeenCalledWith(mockStream, 'task-id');
  });

  test('should call accept API for Extension login option', async () => {
    await task.accept('EXTENSION', 'task-id');

    expect(servicesMock.contact.accept).toHaveBeenCalledWith({ interactionId: 'task-id' });
  });

  test('should handle errors in accept method', async () => {
    const error = new Error('Test Error');
    createMicrophoneStream.mockRejectedValue(error);

    await expect(task.accept(LoginOption.BROWSER, 'task-id')).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'accept', expect.any(String));
  });

  test('should decline call using webCallingService', async () => {
    await task.decline('task-id');

    expect(webCallingServiceMock.declinecall).toHaveBeenCalledWith('task-id');
  });

  test('should handle errors in decline method', async () => {
    const error = new Error('Test Error');
    webCallingServiceMock.declinecall.mockImplementation(() => { throw error; });

    await expect(task.decline('task-id')).rejects.toThrow(error);
    expect(getErrorDetails).toHaveBeenCalledWith(error, 'decline', expect.any(String));
  });
});