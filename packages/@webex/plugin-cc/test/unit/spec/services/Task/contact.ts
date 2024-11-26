/* eslint-disable @typescript-eslint/no-explicit-any */
import * as contact from "packages/@webex/plugin-cc/dist/services/Task/contact";
import { SERVICE } from "../..";
import { AqmReqs } from "../../core/aqm-reqs";

jest.mock("../../core/sdk");
jest.useFakeTimers();

jest.mock("../..", () => {
  return {
    __esModule: true,
    SERVICE: {
      featureflag: {
        isCanaryOrg: jest.fn().mockReturnValue(true),
        isWxccMultiPartyConfEnabled: jest.fn().mockReturnValue(false),
        isWxccPersistCallEnabled: jest.fn().mockReturnValue(false)
      }
    }
  };
});

const fakeAqm: any = new AqmReqs({ onMessage: { listen: jest.fn } } as any);

(httpMock as any).request.mockResolvedValue({
  status: 200,
  data: [],
  statusText: "OK",
  headers: {},
  config: {}
});

describe("Routning contacts", () => {
  it("consultAccept", () => {
    const req = contact.consultAccept({} as any);
    expect(req).toBeDefined();
  });
  it("consultEnd", () => {
    const req = contact.consultEnd({} as any);
    expect(req).toBeDefined();
  });
  it("consult", () => {
    const req = contact.consult({} as any);
    expect(req).toBeDefined();
  });
  it("consult queue", () => {
    const req = contact.consult({
      interactionId: "interactionId",
      data: {
        agentId: "agentid",
        queueId: "queueID",
        trackingId: "trackingId"
      },
      url: "ctq"
    } as any);
    expect(req).toBeDefined();
  });
  it("consult dn", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.consult({
      interactionId: "interactionId",
      data: {
        destAgentId: "destAgentId",
        destinationType: "DN",
        mediaType: "telephony"
      },
      url: ""
    } as any);
    expect(req).toBeDefined();
  });
  it("consult dn", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.consult({
      interactionId: "interactionId",
      data: {
        destAgentId: "destAgentId"
      },
      url: ""
    } as any);
    expect(req).toBeDefined();
  });
  it("cancelCtq", () => {
    const req = contact.cancelCtq({} as any);
    expect(req).toBeDefined();
  });
  it("consult", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.consult({} as any);
    expect(req).toBeDefined();
  });
  it("consultEnd", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.consultEnd({} as any);
    expect(req).toBeDefined();
  });
  it("buddyAgents", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.buddyAgents({
      data: {
        agentProfileId: "agentProfileId",
        mediaType: "meadiType"
      }
    });
    expect(req).toBeDefined();
  });
  it("blindTransfer", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.blindTransfer({
      interactionId: "interactionId",
      data: {
        agentId: "agentId",
        destAgentId: "destAgentId",
        mediaType: "meadiType",
        destAgentTeamId: "destAgentTeamId",
        destAgentDN: "destAgentDN",
        destSiteId: "destSiteId"
      }
    });
    expect(req).toBeDefined();
  });
  it("vteamTransfer", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.vteamTransfer({
      interactionId: "interactionId",
      data: {
        vteamId: "vteamId",
        vteamType: "vteamType"
      }
    });
    expect(req).toBeDefined();
  });
  it("consultTransfer", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.consultTransfer({
      interactionId: "interactionId",
      data: {
        agentId: "agentId",
        destAgentId: "destAgentId",
        mediaType: "mediaType",
        mediaResourceId: "mediaResourceId",
        destinationType: "destinationType"
      }
    });
    expect(req).toBeDefined();
  });
  it("contact End", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.end({
      interactionId: "interactionId",
      data: {}
    } as any);
    expect(req).toBeDefined();
  });
  it("cancel Contact", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.cancelTask({
      interactionId: "interactionId",
      data: {}
    } as any);
    expect(req).toBeDefined();
  });
  it("wrapup contact", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.wrapup({
      interactionId: "interactionId",
      data: { wrapUpReason: "testWrapUpReason", auxCodeId: "auxCodeID1234", isAutoWrapup: "on" }
    } as any);
    expect(req).toBeDefined();
  });
  it("decline contact", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.decline({
      interactionId: "interactionId",
      data: { mediaResourceId: "testMediaResourceId" },
      isConsult: true
    } as any);
    expect(req).toBeDefined();
  });
  it("accept", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.accept({
      interactionId: "interactionId"
    });
    expect(req).toBeDefined();
  });
  it("pauseRecording", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.pauseRecording({
      interactionId: "interactionId"
    });
    expect(req).toBeDefined();
  });
  it("resumeRecording", () => {
    fakeAqm.pendingRequests = {};
    const req = contact.resumeRecording({ interactionId: "interactionId", data: { autoResumed: "true" } } as any);
    expect(req).toBeDefined();
  });
  it("exit conference", () => {
    const req = contact.exitConference({
      interactionId: "interactionId"
    });
    expect(req).toBeDefined();
  });
});
