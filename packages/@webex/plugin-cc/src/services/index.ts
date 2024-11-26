import routingAgent from './agent';
import routingContact from './Task/contact';
import AgentConfigService from './config';
import AqmReqs from './core/aqm-reqs';
import {WebSocketManager} from './core/WebSocket/WebSocketManager';

export default class Services {
  public readonly agent: ReturnType<typeof routingAgent>;
  public readonly config: AgentConfigService;
  public readonly contact: ReturnType<typeof routingContact>;
  private static instance: Services;

  constructor(options: {webSocketManager: WebSocketManager}) {
    const {webSocketManager} = options;
    const aqmReq = new AqmReqs(webSocketManager);
    this.config = new AgentConfigService();
    this.agent = routingAgent(aqmReq);
    this.contact = routingContact(aqmReq);
  }

  public static getInstance(options: {webSocketManager: WebSocketManager}): Services {
    if (!this.instance) {
      this.instance = new Services(options);
    }

    return this.instance;
  }
}
