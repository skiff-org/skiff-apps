export const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly';
// gapi script tag id - used to remove the script
const GAPI_SCRIPT_ID = 'gapi-script';
// google identity script tag id - used to remove the script
const GOOGLE_IDENTITY_SCRIPT_ID = 'gapi-auth-script';
// gapi script tag src
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/platform.js';
// google identity script tag src
const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
// google calendar discovery doc
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export const logoutCalendar = async () => {
  const cred = gapi.client.getToken();
  if (cred !== null) {
    google.accounts.oauth2.revoke(cred.access_token);
    gapi.client.setToken(null);
  }
};

function startGapiClient(onLoad: () => void) {
  // Initialize the JavaScript client library.
  void gapi.client
    .init({
      // TODO: move to env
      apiKey: 'AIzaSyCmhmKxK1Pm2zLLxpLra59GIvgpZMPb2mk',
      // TODO: move to env
      clientId: '1013846747656-qt8pd3qttb7f45pagqnf2i3abu39ggif.apps.googleusercontent.com',
      scope: CALENDAR_SCOPE,
      discoveryDocs: [DISCOVERY_DOC]
    })
    .then(onLoad);
}

export const checkPermissionsToCalendarAndLogin = (cb: () => void) =>
  new Promise((resolve) => {
    if (google.accounts.oauth2.hasGrantedAllScopes(CALENDAR_SCOPE)) {
      resolve(true);
    } else {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: '1013846747656-qt8pd3qttb7f45pagqnf2i3abu39ggif.apps.googleusercontent.com',
          scope: CALENDAR_SCOPE,
          callback: () => {
            cb();
            resolve(true);
          }
        });
        client.requestAccessToken();
      } catch (err) {
        resolve(false);
      }
    }
  });

const createAndAppendScript = (scriptID: string, scriptSRC: string, onload: () => void) => {
  const gapiAuthScript = document.createElement('script');
  gapiAuthScript.id = scriptID;
  gapiAuthScript.src = scriptSRC;
  gapiAuthScript.onload = onload;
  document.body.appendChild(gapiAuthScript);
};

/**
 * create script tag, and append it to the document
 * @param onLoad - action to perform when the script is fully loaded
 */
export const lazyLoadGapiScript = (onLoad: () => void) => {
  // if during tests - dont load scripts
  if ((window as any).testingGapi) {
    onLoad();
    return;
  }

  let firstScriptLoaded = false;
  createAndAppendScript(GOOGLE_IDENTITY_SCRIPT_ID, GOOGLE_IDENTITY_SCRIPT_SRC, () => {
    if (firstScriptLoaded) {
      onLoad();
    } else {
      firstScriptLoaded = true;
    }
  });

  createAndAppendScript(GAPI_SCRIPT_ID, GAPI_SCRIPT_SRC, () => {
    // load gapi client with calendar-v3
    gapi.load('client', () => startGapiClient(onLoad));

    if (firstScriptLoaded) {
      onLoad();
    } else {
      firstScriptLoaded = true;
    }
  });
};

/**
 * removes the gapi script.
 * google have another 2 iframes left in the dom. we leave them there because if they are removed its not possible to remount them
 * @param onRemove - action to perform when the script if dismounted
 */
export const removeGapiScript = (onRemove: () => void) => {
  const gapiScript = document.getElementById(GAPI_SCRIPT_ID);
  const gapiAuthScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);

  if (gapiScript) gapiScript.remove();
  if (gapiAuthScript) gapiAuthScript.remove();

  onRemove();
};
