import EventEmitter from 'events';
import {LINE_EVENTS, createMicrophoneStream} from '@webex/calling';
import {CC_EVENTS} from '../../../../../src/services/config/types';
import {LoginOption} from '../../../../../src/types';
import {getErrorDetails} from '../../../../../src/services/core/Utils';
import { CC_FILE } from '../../../../../src/constants';
import TaskControl from '../../../../../src/services/TaskControl';

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
      loginOption: LoginOption.BROWSER,
      on: jest.fn(),
      answerCall: jest.fn(),
      declinecall: jest.fn()
      
    };

    task = new TaskControl(servicesMock.contact, servicesMock.webSocketManager, webCallingServiceMock);
  });

  it('should emit task:incoming when AGENT_CONTACT_RESERVED event is received for Browser', () => {
    task.call = {
      deviceId: '',
      lineId: '',
      callId: ''
    };
    const mockAgentData =  JSON.stringify({
      data: {
        orgId: "427d8363-8d07-4312-96f3-9ccbe86da324",
        agentId: "3e2e63b1-44c8-4f87-ae12-69f5390c3b42",
        trackingId: "e5f68b64-0187-4d9b-a9fc-79f410c8bad8",
        type: CC_EVENTS.AGENT_CONTACT_RESERVED
      }
    });
    const spy = jest.spyOn(task, 'emit');
    servicesMock.webSocketManager.emit('message', mockAgentData);

    expect(webCallingServiceMock.on).toHaveBeenCalledWith(LINE_EVENTS.INCOMING_CALL, expect.any(Function));
    expect(spy).toHaveBeenCalledWith('task:incoming', JSON.parse(mockAgentData).data);
  });

  it('should emit task:incoming when AGENT_CONTACT_RESERVED event is received for Extension', () => {
    webCallingServiceMock.loginOption = LoginOption.EXTENSION
    const mockAgentData =  JSON.stringify({
      data: {
        orgId: "427d8363-8d07-4312-96f3-9ccbe86da324",
        agentId: "3e2e63b1-44c8-4f87-ae12-69f5390c3b42",
        trackingId: "e5f68b64-0187-4d9b-a9fc-79f410c8bad8",
        type: CC_EVENTS.AGENT_CONTACT_RESERVED
      }
    });
    const spy = jest.spyOn(task, 'emit');
    servicesMock.webSocketManager.emit('message', mockAgentData);

    expect(webCallingServiceMock.on).toHaveBeenCalledWith(LINE_EVENTS.INCOMING_CALL, expect.any(Function));
    expect(spy).toHaveBeenCalledWith('task:incoming', JSON.parse(mockAgentData).data);
  });

  it('should emit task:assigned when AGENT_CONTACT_ASSIGNED event is received', () => {
    const mockAgentData = JSON.stringify({
      data: {
        orgId: "427d8363-8d07-4312-96f3-9ccbe86da324",
        agentId: "3e2e63b1-44c8-4f87-ae12-69f5390c3b42",
        trackingId: "e5f68b64-0187-4d9b-a9fc-79f410c8bad8",
        type: CC_EVENTS.AGENT_CONTACT_ASSIGNED
      }
    });
    const spy = jest.spyOn(task, 'emit');
    servicesMock.webSocketManager.emit('message', mockAgentData);

    expect(spy).toHaveBeenCalledWith('task:assigned', JSON.parse(mockAgentData).data);
  });

  it('should accept call using microphone stream for BROWSER login option', async () => {
    const mockStream = {};
    createMicrophoneStream.mockResolvedValue(mockStream);

    await task.accept('task-id');
    expect(webCallingServiceMock.answerCall).toHaveBeenCalledWith(mockStream, 'task-id');
  });

  it('should call accept API for Extension login option', async () => {
    webCallingServiceMock.loginOption = LoginOption.EXTENSION
    await task.accept('task-id');

    expect(servicesMock.contact.accept).toHaveBeenCalledWith({ interactionId: 'task-id' });
  });

  // it('should handle errors in accept method', async () => {
  //   const error = new Error('Test Error');
  //   createMicrophoneStream.mockRejectedValue(error);

  //   expect(await task.decline('task-id')).toThrow(error);
  //   expect(getErrorDetails).toHaveBeenCalledWith(error, 'accept', CC_FILE);
  // });

  it('should decline call using webCallingService', async () => {
    await task.decline('task-id');

    expect(webCallingServiceMock.declinecall).toHaveBeenCalledWith('task-id');
  });

  // it('should handle errors in decline method', async () => {
  //   const error = new Error('Test Error');
  //   webCallingServiceMock.declinecall.mockImplementation(() => { throw error; });

  //   await task.decline('task-id');
  //   expect(webCallingServiceMock.declinecall).toHaveBeenCalledWith('task-id');
  //   expect(getErrorDetails).toHaveBeenCalledWith(error, 'decline', CC_FILE);
  // });
});