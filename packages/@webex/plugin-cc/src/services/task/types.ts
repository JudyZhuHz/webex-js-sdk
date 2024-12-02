import {Msg} from '../core/GlobalTypes';

export type TaskId = string;

type Enum<T extends Record<string, unknown>> = T[keyof T];

export const DESTINATION_TYPE = {
  QUEUE: 'queue',
  DIALNUMBER: 'dialNumber',
  AGENT: 'agent',
};

export type DestinationType = Enum<typeof DESTINATION_TYPE>;

type MEDIA_CHANNEL =
  | 'email'
  | 'chat'
  | 'telephony'
  | 'social'
  | 'sms'
  | 'facebook'
  | 'whatsapp'
  | string;

export const TASK_EVENTS = {
  TASK_INCOMING: 'task:incoming',
  TASK_ASSIGNED: 'task:assigned',
  TASK_UNASSIGNED: 'task:unassigned',
  TASK_HOLD: 'task:hold',
  TASK_UNHOLD: 'task:unhold',
  TASK_CONSULT: 'task:consult',
  TASK_CONSULT_END: 'task:consultEnd',
  TASK_CONSULT_ACCEPT: 'task:consultAccepted',
  TASK_PAUSE: 'task:pause',
  TASK_RESUME: 'task:resume',
  TASK_END: 'task:end',
  TASK_WRAPUP: 'task:wrapup',
} as const;

export type TASK_EVENTS = Enum<typeof TASK_EVENTS>;

type Interaction = {
  isFcManaged: boolean;
  isTerminated: boolean;
  mediaType: MEDIA_CHANNEL;
  previousVTeams: string[];
  state: string;
  currentVTeam: string;
  participants: any; // todo
  interactionId: string;
  orgId: string;
  createdTimestamp?: number;
  isWrapUpAssist?: boolean;
  callProcessingDetails: {
    QMgrName: string;
    taskToBeSelfServiced: string;
    ani: string;
    displayAni: string;
    dnis: string;
    tenantId: string;
    QueueId: string;
    vteamId: string;
    pauseResumeEnabled?: string;
    pauseDuration?: string;
    isPaused?: string;
    recordInProgress?: string;
    recordingStarted?: string;
    ctqInProgress?: string;
    outdialTransferToQueueEnabled?: string;
    convIvrTranscript?: string;
    customerName: string;
    virtualTeamName: string;
    ronaTimeout: string;
    category: string;
    reason: string;
    sourceNumber: string;
    sourcePage: string;
    appUser: string;
    customerNumber: string;
    reasonCode: string;
    IvrPath: string;
    pathId: string;
    fromAddress: string;
    parentInteractionId?: string;
    childInteractionId?: string;
    relationshipType?: string;
    parent_ANI?: string;
    parent_DNIS?: string;
    consultDestinationAgentJoined?: boolean | string;
    consultDestinationAgentName?: string;
    parent_Agent_DN?: string;
    parent_Agent_Name?: string;
    parent_Agent_TeamName?: string;
    isConferencing?: string;
    monitorType?: string;
    workflowName?: string;
    workflowId?: string;
    monitoringInvisibleMode?: string;
    monitoringRequestId?: string;
    participantInviteTimeout?: string;
    mohFileName?: string;
    CONTINUE_RECORDING_ON_TRANSFER?: string;
    EP_ID?: string;
    ROUTING_TYPE?: string;
    fceRegisteredEvents?: string;
    isParked?: string;
    priority?: string;
    routingStrategyId?: string;
    monitoringState?: string;
    BLIND_TRANSFER_IN_PROGRESS?: boolean;
    fcDesktopView?: string;
  };
  mainInteractionId?: string;
  media: Record<
    string,
    {
      mediaResourceId: string;
      mediaType: MEDIA_CHANNEL;
      mediaMgr: string;
      participants: string[];
      mType: string;
      isHold: boolean;
      holdTimestamp: number | null;
    }
  >;
  owner: string;
  mediaChannel: MEDIA_CHANNEL;
  contactDirection: {type: string};
  outboundType?: string;
  callFlowParams: Record<
    string,
    {
      name: string;
      qualifier: string;
      description: string;
      valueDataType: string;
      value: string;
    }
  >;
};

export type TaskData = {
  mediaResourceId: string;
  eventType: string;
  eventTime?: number;
  agentId: string;
  destAgentId: string;
  trackingId: string;
  consultMediaResourceId: string;
  interaction: Interaction;
  participantId?: string;
  fromOwner?: boolean;
  toOwner?: boolean;
  childInteractionId?: string;
  interactionId: string;
  orgId: string;
  owner: string;
  queueMgr: string;
  queueName?: string;
  type: string;
  ronaTimeout?: number;
  isConsulted?: boolean;
  isConferencing: boolean;
  updatedBy?: string;
  destinationType?: string;
  autoResumed?: boolean;
  reasonCode?: string | number;
  reason?: string;
  consultingAgentId?: string;
  taskId?: string;
  task?: Interaction;
  id?: string; // unique id in monitoring offered event
  isWebCallMute?: boolean;
  reservationInteractionId?: string;
};

export type AgentContact = Msg<{
  mediaResourceId: string;
  eventType: string;
  eventTime?: number;
  agentId: string;
  destAgentId: string;
  trackingId: string;
  consultMediaResourceId: string;
  interaction: Interaction;
  participantId?: string;
  fromOwner?: boolean;
  toOwner?: boolean;
  childInteractionId?: string;
  interactionId: string;
  orgId: string;
  owner: string;
  queueMgr: string;
  queueName?: string;
  type: string;
  ronaTimeout?: number;
  isConsulted?: boolean;
  isConferencing: boolean;
  updatedBy?: string;
  destinationType?: string;
  autoResumed?: boolean;
  reasonCode?: string | number;
  reason?: string;
  consultingAgentId?: string;
  taskId?: string;
  task?: Interaction;
  supervisorId?: string;
  monitorType?: string;
  supervisorDN?: string;
  id?: string; // unique id in monitoring offered event
  isWebCallMute?: boolean;
  reservationInteractionId?: string;
  reservedAgentChannelId?: string;
  monitoringState?: {
    type: string;
  };
  supervisorName?: string;
}>;

export type VTeam = {
  agentProfileId: string;
  agentSessionId: string;
  channelType: string;
  type: string;
  trackingId?: string;
};

export type VteamDetails = {
  name: string;
  channelType: string;
  id: string;
  type: string;
  analyzerId: string;
};

export type VTeamSuccess = Msg<{
  data: {
    vteamList: Array<VteamDetails>;
    allowConsultToQueue: boolean;
  };
  jsMethod: string;
  callData: string;
  agentSessionId: string;
}>;

export type HoldResumePayload = {
  mediaResourceId: string;
};

export type ResumeRecordingPayload = {
  autoResumed: boolean;
};

export type TransferPayLoad = {
  to: string;
  destinationType: DestinationType;
};

export type ConsultPayload = {
  to: string | undefined;
  destinationType: string;
  holdParticipants?: boolean;
};

export type ConsultConferenceData = {
  agentId?: string;
  to: string | undefined;
  destinationType: string;
};

export type cancelCtq = {
  agentId: string;
  queueId: string;
};

export type declinePayload = {
  mediaResourceId: string;
};

export type WrapupPayLoad = {
  wrapUpReason: string;
  auxCodeId: string;
};

export type ContactCleanupData = {
  type: string;
  orgId: string;
  agentId: string;
  data: {
    eventType: string;
    interactionId: string;
    orgId: string;
    mediaMgr: string;
    trackingId: string;
    mediaType: string;
    destination?: string;
    broadcast: boolean;
    type: string;
  };
};

export type TaskResponse = AgentContact | Error | void;

export interface ITask {
  /**
   * Event data received in the CC events
   */
  data: TaskData;
  /**
   * Answers/accepts the incoming task
   *
   * @param taskId - Unique Task Identifier
   * @example
   * ```
   * task.accept(taskId);
   * ```
   */
  accept(taskId: TaskId): Promise<TaskResponse>;
  /**
   * Decline the incoming task for Browser Login
   *
   * @param taskId - Unique Task Identifier
   * @example
   * ```
   * task.decline(taskId);
   * ```
   */
  decline(taskId: TaskId): Promise<TaskResponse>;
  // TODO: Add the remianing public methods
}
