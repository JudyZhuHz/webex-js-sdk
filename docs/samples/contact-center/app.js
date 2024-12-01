/* eslint-disable no-underscore-dangle */
/* eslint-env browser */

/* global Webex */

/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-global-assign */
/* eslint-disable no-multi-assign */
/* eslint-disable max-len */

// Globals
let webex;
let sdk;
let agentDeviceType;
let deviceId;
let agentStatusId;
let agentStatus;
let agentId;
let taskControl;
let task;
let taskId;

const authTypeElm = document.querySelector('#auth-type');
const credentialsFormElm = document.querySelector('#credentials');
const tokenElm = document.querySelector('#access-token');
const saveElm = document.querySelector('#access-token-save');
const authStatusElm = document.querySelector('#access-token-status');
const registerBtn = document.querySelector('#webexcc-register');
const teamsDropdown = document.querySelector('#teamsDropdown');
const agentLogin = document.querySelector('#AgentLogin');
const loginAgentElm = document.querySelector('#loginAgent');
const dialNumber = document.querySelector('#dialNumber');
const registerStatus = document.querySelector('#ws-connection-status');
const idleCodesDropdown = document.querySelector('#idleCodesDropdown')
const setAgentStatusButton = document.querySelector('#setAgentStatus');
const logoutAgentElm = document.querySelector('#logoutAgent');
const buddyAgentsDropdownElm = document.getElementById('buddyAgentsDropdown');
const incomingCallListener = document.querySelector('#incomingsection');
const incomingDetailsElm = document.querySelector('#incoming-call');
const answerElm = document.querySelector('#answer');
const declineElm = document.querySelector('#decline');
const callControlListener = document.querySelector('#callcontrolsection');

// Store and Grab `access-token` from sessionStorage
if (sessionStorage.getItem('date') > new Date().getTime()) {
  tokenElm.value = sessionStorage.getItem('access-token');
}
else {
  sessionStorage.removeItem('access-token');
}

tokenElm.addEventListener('change', (event) => {
  sessionStorage.setItem('access-token', event.target.value);
  sessionStorage.setItem('date', new Date().getTime() + (12 * 60 * 60 * 1000));
});

function changeAuthType() {
  switch (authTypeElm.value) {
    case 'accessToken':
      toggleDisplay('credentials', true);
      toggleDisplay('oauth', false);
      break;
    default:
      break;
  }
}

function toggleDisplay(elementId, status) {
  const element = document.getElementById(elementId);

  if (status) {
    element.classList.remove('hidden');
  }
  else {
    element.classList.add('hidden');
  }
}

const taskControlEvents = new CustomEvent('task:incoming', {
  detail: {
    task: task,
  },
});

function registerListeners(taskControl) {
  taskControl.on('task:incoming', (task) => {
    task = task;
    taskControlEvents.detail.task = task;
    
    incomingCallListener.dispatchEvent(taskControlEvents);
  })    

  taskControl.on('task:assigned', (task) => {
    console.log('Call has been accepted');
    // TODO: Activate the call control buttons once the call is accepted
  }) 
}

function generateWebexConfig({credentials}) {
  return {
    appName: 'sdk-samples',
    appPlatform: 'testClient',
    fedramp: false,
    logger: {
      level: 'log'
    },
    credentials,
    // Any other sdk config we need
  };
}


function initWebex(e) {
  e.preventDefault();
  console.log('Authentication#initWebex()');

  tokenElm.disabled = true;
  saveElm.disabled = true;
  authStatusElm.innerText = 'initializing...';

  const webexConfig = generateWebexConfig({})

  webex = window.webex = Webex.init({
    config: webexConfig,
    credentials: {
      access_token: tokenElm.value
    }
  });

  webex.once('ready', async () => {
    console.log('Authentication#initWebex() :: Webex Ready');

    authStatusElm.innerText = 'Saved access token!';
    registerStatus.innerHTML = 'Not Subscribed';
    registerBtn.disabled = false;
  });

  return false;
}

credentialsFormElm.addEventListener('submit', initWebex);


function register() {
    webex.cc.register(true).then((agentProfile) => {
        registerStatus.innerHTML = 'Subscribed';
        console.log('Event subscription successful: ', agentProfile);
        teamsDropdown.innerHTML = ''; // Clear previously selected option on teamsDropdown
        const listTeams = agentProfile.teams;
        agentId = agentProfile.agentId;
        listTeams.forEach((team) => {
            const option = document.createElement('option');
            option.value = team.id;
            option.text = team.name;
            teamsDropdown.add(option);
        });
        const loginVoiceOptions = agentProfile.loginVoiceOptions;
        agentLogin.innerHTML = '<option value="" selected>Choose Agent Login ...</option>'; // Clear previously selected option on agentLogin.
        dialNumber.value = '';
        dialNumber.disabled = true;
        if (loginVoiceOptions.length > 0) loginAgentElm.disabled = false;
        loginVoiceOptions.forEach((voiceOptions)=> {
          const option = document.createElement('option');
          option.text = voiceOptions;
          option.value = voiceOptions;
          agentLogin.add(option);
        });

        if (agentProfile.isAgentLoggedIn) {
          logoutAgentElm.classList.remove('hidden');
        }

        const idleCodesList = agentProfile.idleCodes;
        
        if(idleCodesList.length > 0) setAgentStatusButton.disabled = false;
        
        idleCodesList.forEach((idleCodes) => {
          if(idleCodes.isSystem === false) {
            const option  = document.createElement('option');
            option.text = idleCodes.name;
            option.value = idleCodes.id;
            idleCodesDropdown.add(option);
          }
        });
    }).catch((error) => {
        console.error('Event subscription failed', error);
    })

    taskControl = webex.cc.taskControl;
    registerListeners(taskControl);
}

async function handleAgentLogin(e) {
  const value = e.target.value;
  agentDeviceType = value
  if (value === 'AGENT_DN') {
    dialNumber.disabled = false;
  } else if (value === 'EXTENSION') {
    dialNumber.disabled = false;
  } else {
    dialNumber.disabled = true;
  }
}

function doAgentLogin() {
  webex.cc.stationLogin({teamId: teamsDropdown.value, loginOption: agentDeviceType, dialNumber: dialNumber.value}).then((response) => {
    console.log('Agent Logged in successfully', response);
    loginAgentElm.disabled = true;
    logoutAgentElm.classList.remove('hidden');
  }
  ).catch((error) => {
    console.log('Agent Login failed', error);
  });
}

async function handleAgentStatus(event) {
  const select = document.getElementById('idleCodesDropdown');
  auxCodeId = event.target.value;
  agentStatus = select.options[select.selectedIndex].text;
}

function setAgentStatus() {
  let state = "Available";
  if(agentStatus !== 'Available') state = 'Idle';
  webex.cc.setAgentState({state, auxCodeId, lastStateChangeReason: agentStatus, agentId}).then((response) => {
    console.log('Agent status set successfully', response);
  }).catch(error => {
    console.error('Agent status set failed', error);
  });
}


function logoutAgent() {
  webex.cc.stationLogout({logoutReason: 'logout'}).then((response) => {
    console.log('Agent logged out successfully', response);
    loginAgentElm.disabled = false;

    setTimeout(() => {
      logoutAgentElm.classList.add('hidden');
    }, 1000);
  }
  ).catch((error) => {
    console.log('Agent logout failed', error);
  });
}

async function fetchBuddyAgents() {
  try {
    buddyAgentsDropdownElm.innerHTML = ''; // Clear previous options
    const buddyAgentsResponse = await webex.cc.getBuddyAgents({mediaType: 'telephony'});

    if (!buddyAgentsResponse || !buddyAgentsResponse.data) {
      console.error('Failed to fetch buddy agents');
      buddyAgentsDropdownElm.innerHTML = `<option disabled="true">Failed to fetch buddy agents<option>`;
      return;
    }

    if (buddyAgentsResponse.data.agentList.length === 0) {
      console.log('The fetched buddy agents list was empty');
      buddyAgentsDropdownElm.innerHTML = `<option disabled="true">No buddy agents available<option>`;
      return;
    }

    buddyAgentsResponse.data.agentList.forEach((agent) => {
      const option = document.createElement('option');
      option.text = `${agent.agentName} - ${agent.state}`;
      option.value = agent.agentId;
      buddyAgentsDropdownElm.add(option);
    });

  } catch (error) {
    console.error('Failed to fetch buddy agents', error);
    buddyAgentsDropdownElm.innerHTML = ''; // Clear previous options
    buddyAgentsDropdownElm.innerHTML = `<option disabled="true">Failed to fetch buddy agents, ${error}<option>`;
  }
}

incomingCallListener.addEventListener('task:incoming', (event) => {
  taskId = event.detail.task.interactionId;
  const callerDisplay = event.detail.task.interaction.callAssociatedDetails.ani;
  
  if (taskControl.webCallingService.loginOption === 'BROWSER') {
    answerElm.disabled = false;
    declineElm.disabled = false;

    incomingDetailsElm.innerText = `Call from ${callerDisplay}`;
  } else {
    incomingDetailsElm.innerText = `Call from ${callerDisplay}...please answer on the endpoint where the agent's extension is registered`;
  }
});

function answer() {
  answerElm.disabled = true;
  declineElm.disabled = true;
  webex.cc.taskControl.accept(taskId);
  incomingDetailsElm.innerText = 'Call Accepted';
}

function decline() {
  answerElm.disabled = true;
  declineElm.disabled = true;
  webex.cc.taskControl.decline(taskId);
  incomingDetailsElm.innerText = 'No incoming calls';
}

const allCollapsibleElements = document.querySelectorAll('.collapsible');
allCollapsibleElements.forEach((el) => {
  el.addEventListener('click', (event) => {
    const {parentElement} = event.currentTarget;

    const sectionContentElement = parentElement.querySelector('.section-content');
    const arrowIcon = parentElement.querySelector('.arrow');

    sectionContentElement.classList.toggle('collapsed');
    arrowIcon.classList.contains('fa-angle-down') ? arrowIcon.classList.replace('fa-angle-down', 'fa-angle-up') : arrowIcon.classList.replace('fa-angle-up', 'fa-angle-down');

    if(el.innerText !== 'Auth & Registration' && !sectionContentElement.classList.contains('collapsed')) {
      // Note: Index of the Auth & Registration section may change if further re-ordering is done
      allCollapsibleElements[1].parentElement.querySelector('.section-content').classList.add('collapsed');
      allCollapsibleElements[1].parentElement.querySelector('.arrow').classList.replace('fa-angle-down', 'fa-angle-up');
    }
  });
});

// Get Access Token from URL and put in access token field
if (window.location.hash) {
  // hacky way to get access token from hash
  const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));

  const accessToken = urlParams.get('access_token');
  const expiresIn = urlParams.get('expires_in');

  if (accessToken) {
    sessionStorage.setItem('access-token', accessToken);
    sessionStorage.setItem('date', new Date().getTime() + parseInt(expiresIn, 10));
    tokenElm.value = accessToken;
  }
}

const allSectionContentElements = document.querySelectorAll('.section-content');
const allArrowElements = document.querySelectorAll('.arrow');

function collapseAll() {
  allSectionContentElements.forEach((el) => {
    el.classList.add('collapsed');
  });

  allArrowElements.forEach((el) => {
    el.classList.replace('fa-angle-down', 'fa-angle-up');
  });
}

function expandAll() {
  allSectionContentElements.forEach((el) => {
    el.classList.remove('collapsed');
  });

  allArrowElements.forEach((el) => {
    el.classList.replace('fa-angle-up', 'fa-angle-down');
  });
}

