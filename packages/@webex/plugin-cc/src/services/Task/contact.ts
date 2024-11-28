import {CC_EVENTS} from '../config/types';
import {createErrDetailsObject as err} from '../core/Utils';
import {WCC_API_GATEWAY} from '../constants';
import AqmReqs from '../core/aqm-reqs';
import {TIMEOUT_REQ} from '../core/constants';
import {
  CONSULT,
  CONSULT_TRANSFER,
  END,
  HOLD,
  PAUSE,
  TASK_API,
  TASK_MESSAGE_TYPE,
  TRANSFER,
  UNHOLD,
  WRAPUP,
} from './constants';
import * as Contact from './types';
import {DESTINATION_TYPE} from './types';

export default function routingContact(aqm: AqmReqs) {
  return {
    /*
     * Accept incoming task
     */
    accept: aqm.req((p: {interactionId: string}) => ({
      url: `${TASK_API}${p.interactionId}/accept`,
      data: {},
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_ASSIGNED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_ASSIGN_FAILED, interactionId: p.interactionId},
        },
        errId: 'Service.aqm.task.accept',
      },
    })),

    /*
     * Hold task
     */
    hold: aqm.req((p: {interactionId: string; data: Contact.HoldResumePayload}) => ({
      url: `${TASK_API}${p.interactionId}${HOLD}`,
      data: p.data,
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_HELD, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_HOLD_FAILED},
        },
        errId: 'Service.aqm.task.hold',
      },
    })),

    /*
     * Unhold task
     */
    unHold: aqm.req((p: {interactionId: string; data: Contact.HoldResumePayload}) => ({
      url: `${TASK_API}${p.interactionId}${UNHOLD}`,
      data: p.data,
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_UNHELD, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_UNHOLD_FAILED},
        },
        errId: 'Service.aqm.task.unHold',
      },
    })),

    /*
     * Pause Recording
     */
    pauseRecording: aqm.req((p: {interactionId: string}) => ({
      url: `${TASK_API}${p.interactionId}${PAUSE}`,
      data: {},
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.CONTACT_RECORDING_PAUSED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.CONTACT_RECORDING_PAUSE_FAILED},
        },
        errId: 'Service.aqm.task.pauseRecording',
      },
    })),

    /*
     * Resume Recording
     */
    resumeRecording: aqm.req(
      (p: {interactionId: string; data: Contact.ResumeRecordingPayload}) => ({
        url: `${TASK_API}${p.interactionId}/record/resume`,
        data: p.data,
        host: WCC_API_GATEWAY,
        err,
        notifSuccess: {
          bind: {
            type: TASK_MESSAGE_TYPE,
            data: {type: CC_EVENTS.CONTACT_RECORDING_RESUMED, interactionId: p.interactionId},
          },
          msg: {} as Contact.AgentContact,
        },
        notifFail: {
          bind: {
            type: TASK_MESSAGE_TYPE,
            data: {type: CC_EVENTS.CONTACT_RECORDING_RESUME_FAILED},
          },
          errId: 'Service.aqm.task.resumeRecording',
        },
      })
    ),

    /*
     * Consult contact
     */
    consult: aqm.req((p: {interactionId: string; data: Contact.ConsultPayload}) => ({
      url: `${TASK_API}${p.interactionId}${CONSULT}`,
      data: p.data,
      timeout:
        p.data && p.data.destinationType === DESTINATION_TYPE.QUEUE ? 'disabled' : TIMEOUT_REQ,
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONSULT_CREATED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {
            type:
              p.data && p.data.destinationType === DESTINATION_TYPE.QUEUE
                ? CC_EVENTS.AGENT_CTQ_FAILED
                : CC_EVENTS.AGENT_CONSULT_FAILED,
          },
        },
        errId: 'Service.aqm.task.consult',
      },
      notifCancel: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: 'AgentCtqCancelled', interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
    })),

    /*
     * Consult Accept contact
     */
    consultAccept: aqm.req((p: {interactionId: string}) => ({
      url: `${TASK_API}${p.interactionId}/consult/accept`,
      data: {},
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONSULTING, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_ASSIGN_FAILED},
        },
        errId: 'Service.aqm.task.consultAccept',
      },
    })),

    /*
     * BlindTransfer contact
     */
    blindTransfer: aqm.req((p: {interactionId: string; data: Contact.TransferPayLoad}) => ({
      url: `${TASK_API}${p.interactionId}${TRANSFER}`,
      data: p.data,
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_BLIND_TRANSFERRED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: 'AgentBlindTransferFailedEvent'},
        },
        errId: 'Service.aqm.task.AgentBlindTransferFailedEvent',
      },
    })),

    /*
     * VteamTransfer contact
     */
    vteamTransfer: aqm.req((p: {interactionId: string; data: Contact.TransferPayLoad}) => ({
      url: `${TASK_API}${p.interactionId}${TRANSFER}`,
      data: p.data,
      host: WCC_API_GATEWAY,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_VTEAM_TRANSFERRED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_VTEAM_TRANSFER_FAILED},
        },
        errId: 'Service.aqm.task.AgentVteamTransferFailed',
      },
    })),

    /*
     * Consult Transfer contact
     */
    consultTransfer: aqm.req(
      (p: {interactionId: string; data: Contact.ConsultTransferPayLoad}) => ({
        url: `${TASK_API}${p.interactionId}${CONSULT_TRANSFER}`,
        data: p.data,
        host: WCC_API_GATEWAY,
        err,
        notifSuccess: {
          bind: {
            type: TASK_MESSAGE_TYPE,
            data: {
              type: [CC_EVENTS.AGENT_CONSULT_TRANSFERRED, CC_EVENTS.AGENT_CONSULT_TRANSFERRING],
              interactionId: p.interactionId,
            },
          },
          msg: {} as Contact.AgentContact,
        },
        notifFail: {
          bind: {
            type: TASK_MESSAGE_TYPE,
            data: {type: CC_EVENTS.AGENT_CONSULT_TRANSFER_FAILED},
          },
          errId: 'Service.aqm.task.AgentConsultTransferFailed',
        },
      })
    ),

    /*
     * End contact
     */
    end: aqm.req((p: {interactionId: string}) => ({
      url: `${TASK_API}${p.interactionId}${END}`,
      data: {},
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_WRAPUP, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_END_FAILED},
        },
        errId: 'Service.aqm.task.end',
      },
    })),

    /*
     * Wrapup contact
     */
    wrapup: aqm.req((p: {interactionId: string; data: Contact.WrapupPayLoad}) => ({
      url: `${TASK_API}${p.interactionId}${WRAPUP}`,
      data: p.data,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_WRAPPEDUP, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_WRAPUP_FAILED},
        },
        errId: 'Service.aqm.task.wrapup',
      },
    })),

    /*
     * Cancel popover
     */
    cancelTask: aqm.req((p: {interactionId: string}) => ({
      url: `${TASK_API}${p.interactionId}${END}`,
      data: {},
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.CONTACT_ENDED, interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: CC_EVENTS.AGENT_CONTACT_END_FAILED},
        },
        errId: 'Service.aqm.task.end',
      },
    })),

    /*
     * Cancel Ctq request
     */
    cancelCtq: aqm.req((p: {interactionId: string; data: Contact.cancelCtq}) => ({
      url: `${TASK_API}${p.interactionId}/cancelCtq`,
      data: p.data,
      err,
      notifSuccess: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: 'AgentCtqCancelled', interactionId: p.interactionId},
        },
        msg: {} as Contact.AgentContact,
      },
      notifFail: {
        bind: {
          type: TASK_MESSAGE_TYPE,
          data: {type: 'AgentCtqCancelFailed'},
        },
        errId: 'Service.aqm.task.cancelCtq',
      },
    })),
  };
}

// /*
//  * Get list of queues available.
//  */
// vteamList: aqm.req((p: { data: Contact.VTeam }) => ({
//     url: `/vteams`,
//     data: p.data,
//     err,
//     notifSuccess: {
//       bind: {
//         type: "VteamList",
//         data: { jsMethod: "vteamListChanged" }
//       },
//       msg: {} as Contact.VTeamSuccess
//     },
//     notifFail: {
//       bind: {
//         type: "VteamListFailed",
//         data: { statusCode: 500 }
//       },
//       errId: "Service.aqm.task.VteamListFailed"
//     }
//   })),
