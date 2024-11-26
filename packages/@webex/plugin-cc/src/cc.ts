import {WebexPlugin} from '@webex/webex-core';
import {
  SetStateResponse,
  CCPluginConfig,
  IContactCenter,
  WebexSDK,
  LoginOption,
  AgentLogin,
  StationLoginResponse,
  StationLogoutResponse,
  StationReLoginResponse,
  BuddyAgentsResponse,
  BuddyAgents,
  SubscribeRequest,
} from './types';
import {READY, CC_FILE, EMPTY_STRING} from './constants';
import HttpRequest from './services/core/HttpRequest';
import WebCallingService from './services/WebCallingService';
import {AGENT, WEB_RTC_PREFIX} from './services/constants';
import {WebSocketManager} from './services/core/WebSocket/WebSocketManager';
import Services from './services';
import LoggerProxy from './logger-proxy';
import {StateChange, Logout} from './services/agent/types';
import {ConnectionService} from './services/core/WebSocket/connection-service';
import {getErrorDetails} from './services/core/Utils';
import {Profile, WelcomeEvent} from './services/config/types';
import Task from './services/Task';

export default class ContactCenter extends WebexPlugin implements IContactCenter {
  namespace = 'cc';
  private $config: CCPluginConfig;
  private $webex: WebexSDK;
  private agentConfig: Profile;
  private httpRequest: HttpRequest;
  private webSocketManager: WebSocketManager;
  private webCallingService: WebCallingService;
  private connectionService: ConnectionService;
  private services: Services;
  private task: Task;

  constructor(...args) {
    super(...args);

    // @ts-ignore
    this.$webex = this.webex;

    this.$webex.once(READY, () => {
      // @ts-ignore
      this.$config = this.config;

      /**
       * This is used for handling the async requests by sending webex.request and wait for corresponding websocket event.
       */
      this.httpRequest = HttpRequest.getInstance({
        webex: this.$webex,
      });

      this.webSocketManager = new WebSocketManager({webex: this.$webex});

      this.connectionService = new ConnectionService(
        this.webSocketManager,
        this.getConnectionConfig()
      );

      this.services = Services.getInstance({
        webSocketManager: this.webSocketManager,
      });

      this.webCallingService = new WebCallingService(this.$webex, this.$config.callingClientConfig);
      this.task = new Task(this.services, this.webCallingService);

      LoggerProxy.initialize(this.$webex.logger);
    });
  }

  /**
   * This is used for making the CC SDK ready by setting up the cc mercury connection.
   */
  public async register(): Promise<Profile> {
    try {
      return await this.connectWebsocket();
    } catch (error) {
      this.$webex.logger.error(`file: ${CC_FILE}: Error during register: ${error}`);

      throw error;
    }
  }

  /**
   * Returns the list of buddy agents in the given state and media according to agent profile settings
   *
   * @param {BuddyAgents} data - The data required to fetch buddy agents, including additional agent profile information.
   * @returns {Promise<BuddyAgentsResponse>} A promise that resolves to the response containing buddy agents information.
   * @throws Error
   * @example getBuddyAgents({state: 'Available', mediaType: 'telephony'})
   */
  public async getBuddyAgents(data: BuddyAgents): Promise<BuddyAgentsResponse> {
    try {
      return await this.services.agent.buddyAgents({
        data: {agentProfileId: this.agentConfig.agentProfileID, ...data},
      });
    } catch (error) {
      throw getErrorDetails(error, 'getBuddyAgents');
    }
  }

  /**
   * This is used for connecting the websocket and fetching the agent profile.
   * @returns Promise<IAgentProfile>
   * @throws Error
   * @private
   */
  private async connectWebsocket() {
    try {
      return this.webSocketManager
        .initWebSocket({
          body: this.getConnectionConfig(),
        })
        .then(async (data: WelcomeEvent) => {
          const agentId = data.agentId;
          const orgId = this.$webex.credentials.getOrgId();
          this.agentConfig = await this.services.config.getAgentConfig(orgId, agentId);
          this.$webex.logger.log(`file: ${CC_FILE}: agent config is fetched successfully`);

          return this.agentConfig;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      this.$webex.logger.error(`file: ${CC_FILE}: Error during register: ${error}`);

      throw error;
    }
  }

  /**
   * This is used for agent login.
   * @param data
   * @returns Promise<StationLoginResponse>
   * @throws Error
   */
  public async stationLogin(data: AgentLogin): Promise<StationLoginResponse> {
    try {
      const loginResponse = this.services.agent.stationLogin({
        data: {
          dialNumber:
            data.loginOption === LoginOption.BROWSER ? this.agentConfig.agentId : data.dialNumber,
          teamId: data.teamId,
          deviceType: data.loginOption,
          isExtension: data.loginOption === LoginOption.EXTENSION,
          deviceId: this.getDeviceId(data.loginOption, data.dialNumber),
          roles: [AGENT],
          // TODO: The public API should not have the following properties so filling them with empty values for now. If needed, we can add them in the future.
          teamName: EMPTY_STRING,
          siteId: EMPTY_STRING,
          usesOtherDN: false,
          auxCodeId: EMPTY_STRING,
        },
      });

      if (data.loginOption === LoginOption.BROWSER) {
        await this.webCallingService.registerWebCallingLine();
      }

      await loginResponse;

      return loginResponse;
    } catch (error) {
      throw getErrorDetails(error, 'stationLogin');
    }
  }

  /** This is used for agent logout.
   * @param data
   * @returns Promise<StationLogoutResponse>
   * @throws Error
   */
  public async stationLogout(data: Logout): Promise<StationLogoutResponse> {
    try {
      const logoutResponse = this.services.agent.logout({
        data,
      });

      await logoutResponse;

      if (this.webCallingService) {
        this.webCallingService.deregisterWebCallingLine();
      }

      return logoutResponse;
    } catch (error) {
      throw getErrorDetails(error, 'stationLogout');
    }
  }

  /* This is used for agent relogin.
   * @returns Promise<StationReLoginResponse>
   * @throws Error
   */
  public async stationReLogin(): Promise<StationReLoginResponse> {
    try {
      const reLoginResponse = await this.services.agent.reload();

      return reLoginResponse;
    } catch (error) {
      throw getErrorDetails(error, 'stationReLogin');
    }
  }

  private getDeviceId(loginOption: string, dialNumber: string): string {
    if (loginOption === LoginOption.EXTENSION || loginOption === LoginOption.AGENT_DN) {
      return dialNumber;
    }

    return WEB_RTC_PREFIX + this.agentConfig.agentId;
  }

  /**
   * This is used for setting agent state.
   * @param options
   * @returns Promise<SetStateResponse>
   * @throws Error
   */

  public async setAgentState(data: StateChange): Promise<SetStateResponse> {
    try {
      const agentStatusResponse = await this.services.agent.stateChange({
        data: {...data, agentId: data.agentId || this.agentConfig.agentId},
      });

      this.$webex.logger.log(`file: ${CC_FILE}: SET AGENT STATUS API SUCCESS`);

      return agentStatusResponse;
    } catch (error) {
      throw getErrorDetails(error, 'setAgentState');
    }
  }

  /**
   * This method returns the connection configuration.
   */
  private getConnectionConfig(): SubscribeRequest {
    return {
      force: this.$config?.force ?? true,
      isKeepAliveEnabled: this.$config?.isKeepAliveEnabled ?? false,
      clientType: this.$config?.clientType ?? 'WebexCCSDK',
      allowMultiLogin: this.$config?.allowMultiLogin ?? true,
    };
  }
}
