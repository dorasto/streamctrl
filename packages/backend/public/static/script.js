const wsUrl = `ws://${window.location.host}/ws`;
const scenesApiUrl = `/api/scenes`;
const obsProfilesApiUrl = `/api/obs-profiles`;
const selectProfileApiUrl = `/api/select-obs-profile`;
const obsStatusApiUrl = `/api/obs-status`;

// NEW API Endpoints
const sceneItemsApiUrl = `/api/scene-items`; // To get sources in current scene
const sourceVisibilityApiUrl = `/api/source-visibility`; // To toggle source visibility
const sourceFiltersApiUrl = `/api/source-filters`; // To get filters for a source
const filterVisibilityApiUrl = `/api/filter-visibility`; // To toggle filter visibility

let ws;
let currentProfileId = null;
let sceneItemId = 0;
let Authfailed = false;
// --- UI Elements ---
const relayStatusEl = document.getElementById("relayStatus");
const obsStatusEl = document.getElementById("obsStatus");
const activeProfileNameEl = document.getElementById("activeProfileName");
const currentSceneEl = document.getElementById("currentScene");
const messagesObsEl = document.getElementById("messages-obs");
const messagesApiRelayWsEl = document.getElementById("messages-api-relay-ws");
const messagesApiHttpServerEl = document.getElementById(
  "messages-api-http-server"
);

const profileSelectEl = document.getElementById("profileSelect");
const connectProfileBtn = document.getElementById("connectProfileBtn");
const refreshProfilesBtn = document.getElementById("refreshProfilesBtn");

const sceneSelectEl = document.getElementById("sceneSelect");
const setSceneBtn = document.getElementById("setSceneBtn");
const refreshScenesBtn = document.getElementById("refreshScenesBtn");

// NEW: Source Control UI Elements
const sourceSelectEl = document.getElementById("sourceSelect");
const toggleSourceBtn = document.getElementById("toggleSourceBtn");
const refreshSourcesBtn = document.getElementById("refreshSourcesBtn");

// NEW: Filter Control UI Elements
const filterSourceSelectEl = document.getElementById("filterSourceSelect");
const getFiltersBtn = document.getElementById("getFiltersBtn");
const filterSelectEl = document.getElementById("filterSelect");
const toggleFilterBtn = document.getElementById("toggleFilterBtn");

// --- State Variables ---
let obsConnectionReady = false;
let currentSceneItems = []; // To store fetched scene items and their IDs/visibility
let currentSourceFilters = []; // To store fetched filters for a selected source

// --- WebSocket Connection ---
function connectWebSocket() {
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("Connected to Hono OBS Relay WebSocket!");
    updateStatus(relayStatusEl, "connected", "Connected");
    fetchObsStatusApi(true);
  };

  ws.onmessage = (event) => {
    const dataString =
      typeof event.data === "string"
        ? event.data
        : new TextDecoder().decode(event.data);
    let data;
    try {
      data = JSON.parse(dataString);
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
      appendMessage(messagesApiRelayWsEl, {
        error: "Failed to parse incoming WebSocket message.",
      });
      return;
    }

    switch (data.type) {
      case "obs_message":
        appendMessage(messagesObsEl, data.data);
        handleObsMessage(data.data);
        break;
      case "relay_obs_status":
        appendMessage(messagesApiRelayWsEl, data);
        handleRelayObsStatus(data.data);
        break;
      case "relay_connection_status":
        if (data.data.status === "Auth Failed") {
          Authfailed = true;
        }
        appendMessage(messagesApiRelayWsEl, data);
        break;
      default:
        console.warn("Received unknown message type from relay:", data);
        appendMessage(messagesApiRelayWsEl, data);
        break;
    }
  };

  ws.onclose = () => {
    console.log("Disconnected from Hono OBS Relay WebSocket.");
    appendMessage(messagesApiRelayWsEl, {
      type: "Relay_Connection_Status",
      status: "Disconnected",
      message: "Disconnected from Relay WebSocket",
    });
    updateStatus(relayStatusEl, "disconnected", "Disconnected");
    updateStatus(obsStatusEl, "disconnected", "Disconnected");
    activeProfileNameEl.textContent = "-";
    obsConnectionReady = false;
    // Disable all OBS-dependent controls
    sceneSelectEl.innerHTML = '<option value="">OBS Disconnected</option>';
    sceneSelectEl.disabled = true;
    setSceneBtn.disabled = true;
    currentSceneEl.textContent = "-";

    sourceSelectEl.innerHTML = '<option value="">OBS Disconnected</option>'; // NEW
    sourceSelectEl.disabled = true; // NEW
    toggleSourceBtn.disabled = true; // NEW
    refreshSourcesBtn.disabled = true; // NEW

    filterSourceSelectEl.innerHTML =
      '<option value="">OBS Disconnected</option>'; // NEW
    filterSourceSelectEl.disabled = true; // NEW
    getFiltersBtn.disabled = true; // NEW
    filterSelectEl.innerHTML = '<option value="">Select Source First</option>'; // NEW
    filterSelectEl.disabled = true; // NEW
    toggleFilterBtn.disabled = true; // NEW
    if (!Authfailed) {
      setTimeout(connectWebSocket, 3000);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket Error:", error);
    appendMessage(messagesApiRelayWsEl, {
      type: "Relay_Connection_Status",
      status: "Error",
      message: `Relay WebSocket Error: ${error.message || error.type}`,
    });
    updateStatus(relayStatusEl, "disconnected", `Error: ${error.message}`);
    updateStatus(obsStatusEl, "disconnected", "Disconnected");
  };
}

// --- Handle Custom OBS Status Messages from Relay ---
function handleRelayObsStatus(data) {
  if (data.connection === "identified") {
    obsConnectionReady = true;
    updateStatus(obsStatusEl, "connected", "Connected");
    activeProfileNameEl.textContent = data.profile.name;
    if (profileSelectEl.value !== data.profile.id) {
      profileSelectEl.value = data.profile.id;
    }
    fetchScenesApi();
    // Enable new controls
    sourceSelectEl.disabled = false; // NEW
    toggleSourceBtn.disabled = false; // NEW
    refreshSourcesBtn.disabled = false; // NEW
    filterSourceSelectEl.disabled = false; // NEW
    getFiltersBtn.disabled = false; // NEW
    fetchSceneItemsApi(); // NEW: Fetch sources for current scene
  } else if (data.connection === "disconnected") {
    obsConnectionReady = false;
    updateStatus(obsStatusEl, "disconnected", "Disconnected");
    currentSceneEl.textContent = "-";
    sceneSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
    sceneSelectEl.disabled = true;
    setSceneBtn.disabled = true;

    sourceSelectEl.innerHTML = '<option value="">OBS Disconnected</option>'; // NEW
    sourceSelectEl.disabled = true; // NEW
    toggleSourceBtn.disabled = true; // NEW
    refreshSourcesBtn.disabled = true; // NEW

    filterSourceSelectEl.innerHTML =
      '<option value="">OBS Disconnected</option>'; // NEW
    filterSourceSelectEl.disabled = true; // NEW
    getFiltersBtn.disabled = true; // NEW
    filterSelectEl.innerHTML = '<option value="">Select Source First</option>'; // NEW
    filterSelectEl.disabled = true; // NEW
    toggleFilterBtn.disabled = true; // NEW
  }
}

// --- OBS Message Handling (Processes the 'data' part of {type: "obs_message", data: ...}) ---
function handleObsMessage(obsData) {
  switch (obsData.op) {
    case 0: // Hello
      // console.log("OBS Hello message received:", obsData.d);
      break;
    case 1: // Identify
      console.warn("Unexpected OBS Identify message received:", obsData.d);
      break;
    case 2: // Identified
      // console.log("OBS Identified message received (raw):", obsData.d);
      break;
    case 3: // Reidentify
      // console.log("OBS Reidentify message received:", obsData.d);
      break;
    case 5: // Event
      const eventType = obsData.d.eventType;
      const eventData = obsData.d.eventData;
      console.log(`OBS Event: ${eventType}`, eventData);

      switch (eventType) {
        case "CurrentProgramSceneChanged":
          currentSceneEl.textContent = eventData.sceneName;
          if (sceneSelectEl.value !== eventData.sceneName) {
            sceneSelectEl.value = eventData.sceneName;
          }
          fetchSceneItemsApi(); // Refresh sources when scene changes
          break;
        case "SceneListChanged":
          fetchScenesApi();
          break;
        case "SceneItemEnableStateChanged": // NEW: Update source visibility in UI
          // This event has `sceneName`, `sceneItemId`, `sceneItemIndex`, `sceneItemEnabled`
          console.log("Source visibility changed:", eventData);
          // Optionally re-fetch items or update specific item's status visually if you had checkboxes next to them
          fetchSceneItemsApi(); // Simplest way to reflect changes immediately
          break;
        case "SourceFilterEnableStateChanged": // NEW: Update filter visibility in UI
          // This event has `sourceName`, `filterName`, `filterEnabled`
          console.log("Filter visibility changed:", eventData);
          // Re-fetch filters for the currently selected source
          if (filterSourceSelectEl.value === eventData.sourceName) {
            fetchSourceFiltersApi(eventData.sourceName);
          }
          break;
        // Add other relevant OBS events if you want to react to them
        case "InputCreated":
        case "InputRemoved":
        case "InputNameChanged":
        case "InputActiveStateChanged": // Source became active/inactive (e.g. streaming, recording)
          // If you want sources to reflect active state
          fetchSceneItemsApi();
          break;
        case "SourceFilterCreated":
        case "SourceFilterRemoved":
        case "SourceFilterNameChanged":
          // Re-fetch filters if list changes
          if (filterSourceSelectEl.value === eventData.sourceName) {
            fetchSourceFiltersApi(eventData.sourceName);
          }
          break;
      }
      break;
    case 6: // Request
      console.warn("Unexpected OBS Request message received:", obsData.d);
      break;
    case 7: // RequestResponse
      const requestType = obsData.d.requestType;
      const requestStatus = obsData.d.requestStatus;

      if (!requestStatus.result) {
        console.error(
          `OBS Request Failed (${requestType}): ${requestStatus.comment}`
        );
        appendMessage(messagesObsEl, {
          error: `Request ${requestType} failed from OBS: ${requestStatus.comment}`,
        });
      }
      break;
    case 8: // RequestBatch
      console.log("OBS RequestBatch message received:", obsData.d);
      break;
    case 9: // RequestBatchResponse
      console.log("OBS RequestBatchResponse message received:", obsData.d);
      break;
    default:
      console.warn(`Unknown OBS OpCode ${obsData.op} received:`, obsData);
      break;
  }
}

// --- UI Utility Functions ---
function updateStatus(element, status, text) {
  element.textContent = text;
  element.className = "status-indicator " + status;
  if (status !== "connected") {
    element.style.animation = "none";
  } else {
    element.style.animation = "";
  }
}

function appendMessage(targetElement, message) {
  const isScrolledToBottom =
    targetElement.scrollHeight - targetElement.clientHeight <=
    targetElement.scrollTop + 1;
  targetElement.textContent += JSON.stringify(message, null, 2) + "\n";
  if (isScrolledToBottom) {
    targetElement.scrollTop = targetElement.scrollHeight;
  }
}

// --- API Functions ---
async function fetchObsStatusApi(andFetchScenes = false) {
  try {
    const response = await fetch(obsStatusApiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Fetched OBS Status (HTTP): ${JSON.stringify(data)}`,
    });
    obsConnectionReady = data.connected;
    currentProfileId = data.currentProfileId;
    updateStatus(
      obsStatusEl,
      data.connected ? "connected" : "disconnected",
      data.connected ? "Connected" : "Disconnected"
    );
    activeProfileNameEl.textContent = data.currentProfile;

    if (profileSelectEl.value !== currentProfileId) {
      profileSelectEl.value = currentProfileId || "";
    }

    if (obsConnectionReady && andFetchScenes) {
      sourceSelectEl.disabled = false;
      toggleSourceBtn.disabled = false;
      refreshSourcesBtn.disabled = false;
      filterSourceSelectEl.disabled = false;
      getFiltersBtn.disabled = false;
    } else if (!obsConnectionReady) {
      // Disable all OBS-dependent controls
      sceneSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
      sceneSelectEl.disabled = true;
      setSceneBtn.disabled = true;
      currentSceneEl.textContent = "-";
      sourceSelectEl.innerHTML = '<option value="">OBS Not Connected</option>'; // NEW
      sourceSelectEl.disabled = true; // NEW
      toggleSourceBtn.disabled = true; // NEW
      refreshSourcesBtn.disabled = true; // NEW
      filterSourceSelectEl.innerHTML =
        '<option value="">OBS Not Connected</option>'; // NEW
      filterSourceSelectEl.disabled = true; // NEW
      getFiltersBtn.disabled = true; // NEW
      filterSelectEl.innerHTML =
        '<option value="">Select Source First</option>'; // NEW
      filterSelectEl.disabled = true; // NEW
      toggleFilterBtn.disabled = true; // NEW
    }
  } catch (error) {
    console.error("Error fetching OBS status:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to fetch OBS status (HTTP): ${error.message}`,
    });
    updateStatus(obsStatusEl, "unknown", "Error fetching status");
    activeProfileNameEl.textContent = "Error";
    obsConnectionReady = false;
    // Disable all OBS-dependent controls on error
    sceneSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
    sceneSelectEl.disabled = true;
    setSceneBtn.disabled = true;
    currentSceneEl.textContent = "-";
    sourceSelectEl.innerHTML = '<option value="">OBS Not Connected</option>'; // NEW
    sourceSelectEl.disabled = true; // NEW
    toggleSourceBtn.disabled = true; // NEW
    refreshSourcesBtn.disabled = true; // NEW
    filterSourceSelectEl.innerHTML =
      '<option value="">OBS Not Connected</option>'; // NEW
    filterSourceSelectEl.disabled = true; // NEW
    getFiltersBtn.disabled = true; // NEW
    filterSelectEl.innerHTML = '<option value="">Select Source First</option>'; // NEW
    filterSelectEl.disabled = true; // NEW
    toggleFilterBtn.disabled = true; // NEW
  }
}

async function fetchObsProfilesApi() {
  profileSelectEl.innerHTML = '<option value="">Loading Profiles...</option>';
  profileSelectEl.disabled = true;
  connectProfileBtn.disabled = true;
  try {
    const response = await fetch(obsProfilesApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const profiles = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Fetched OBS Profiles (HTTP): ${profiles.length} profiles found.`,
    });
    populateProfileSelect(profiles);
  } catch (error) {
    console.error("Error fetching OBS profiles:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to fetch OBS profiles (HTTP): ${error.message}`,
    });
    profileSelectEl.innerHTML =
      '<option value="">Failed to load profiles</option>';
  } finally {
    profileSelectEl.disabled = false;
    connectProfileBtn.disabled = false;
  }
}

async function selectObsProfileApi(profileId) {
  updateStatus(obsStatusEl, "connecting", "Connecting...");
  activeProfileNameEl.textContent =
    profileSelectEl.options[profileSelectEl.selectedIndex].text;

  try {
    const response = await fetch(selectProfileApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Profile selection initiated via HTTP API:", data);
    appendMessage(messagesApiHttpServerEl, {
      success: `Profile change initiated (HTTP): ${
        activeProfileNameEl.textContent
      }. Backend response: ${JSON.stringify(data)}`,
    });
  } catch (error) {
    console.error("Error selecting OBS profile via HTTP API:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to select OBS profile (HTTP): ${error.message}`,
    });
    updateStatus(obsStatusEl, "disconnected", "Connection Failed");
    fetchObsStatusApi();
  }
}

function populateProfileSelect(profiles) {
  profileSelectEl.innerHTML = "";
  if (profiles.length === 0) {
    profileSelectEl.innerHTML =
      '<option value="">No Profiles Available</option>';
    profileSelectEl.disabled = true;
    connectProfileBtn.disabled = true;
    return;
  }

  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelectEl.appendChild(option);
  });

  if (
    currentProfileId &&
    Array.from(profileSelectEl.options).some(
      (opt) => opt.value === currentProfileId
    )
  ) {
    profileSelectEl.value = currentProfileId;
  } else if (profiles.length > 0) {
    profileSelectEl.value = profiles[0].id;
  }
}

function populateSceneSelect(scenes) {
  sceneSelectEl.innerHTML = "";
  if (!scenes || scenes.length === 0) {
    sceneSelectEl.innerHTML = '<option value="">No Scenes Available</option>';
    sceneSelectEl.disabled = true;
    setSceneBtn.disabled = true;
    currentSceneEl.textContent = "-";
    return;
  }
  scenes.forEach((scene) => {
    const option = document.createElement("option");
    option.value = scene.sceneName;
    option.textContent = scene.sceneName;
    sceneSelectEl.appendChild(option);
  });

  if (
    currentSceneEl.textContent !== "-" &&
    Array.from(sceneSelectEl.options).some(
      (opt) => opt.value === currentSceneEl.textContent
    )
  ) {
    sceneSelectEl.value = currentSceneEl.textContent;
  }

  sceneSelectEl.disabled = false;
  if (obsConnectionReady) {
    setSceneBtn.disabled = false;
  }
}

async function fetchScenesApi() {
  if (!obsConnectionReady) {
    sceneSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
    sceneSelectEl.disabled = true;
    setSceneBtn.disabled = true;
    currentSceneEl.textContent = "-";
    return;
  }
  sceneSelectEl.innerHTML = '<option value="">Loading Scenes...</option>';
  sceneSelectEl.disabled = true;
  setSceneBtn.disabled = true;
  try {
    const response = await fetch(scenesApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Fetched Scenes (HTTP): ${
        data.scenes ? data.scenes.length : 0
      } scenes found.`,
    });
    populateSceneSelect(data.scenes);
    sceneItemId = data.currentProgramSceneUuid;
    currentSceneEl.textContent = data.currentProgramSceneName || "-";
  } catch (error) {
    console.error("Error fetching scenes via HTTP API:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to fetch scenes (HTTP): ${error.message}`,
    });
    sceneSelectEl.innerHTML = '<option value="">Failed to load scenes</option>';
  } finally {
    sceneSelectEl.disabled = false;
    if (obsConnectionReady) {
      setSceneBtn.disabled = false;
    }
  }
}

async function setSceneApi(sceneName) {
  if (!obsConnectionReady) {
    appendMessage(messagesApiHttpServerEl, {
      warning: "Cannot set scene: OBS is not connected.",
    });
    return;
  }
  try {
    const response = await fetch(scenesApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sceneName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Scene change HTTP API call successful:", data);
    appendMessage(messagesApiHttpServerEl, {
      success: `Scene change initiated (HTTP): ${sceneName}. Backend response: ${JSON.stringify(
        data
      )}`,
    });
  } catch (error) {
    console.error("Error setting scene via HTTP API:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to set scene (HTTP): ${error.message}`,
    });
  }
}

// NEW: API Functions for Sources and Filters
async function fetchSceneItemsApi() {
  if (!obsConnectionReady) {
    sourceSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
    sourceSelectEl.disabled = true;
    toggleSourceBtn.disabled = true;
    refreshSourcesBtn.disabled = true;
    filterSourceSelectEl.innerHTML =
      '<option value="">OBS Not Connected</option>';
    filterSourceSelectEl.disabled = true;
    getFiltersBtn.disabled = true;
    filterSelectEl.innerHTML = '<option value="">Select Source First</option>';
    filterSelectEl.disabled = true;
    toggleFilterBtn.disabled = true;
    return;
  }

  sourceSelectEl.innerHTML = '<option value="">Loading Sources...</option>';
  sourceSelectEl.disabled = true;
  toggleSourceBtn.disabled = true;
  refreshSourcesBtn.disabled = true;
  filterSourceSelectEl.innerHTML =
    '<option value="">Loading Sources...</option>';
  filterSourceSelectEl.disabled = true;
  getFiltersBtn.disabled = true;
  filterSelectEl.innerHTML = '<option value="">Select Source First</option>'; // Clear filters too
  filterSelectEl.disabled = true;
  toggleFilterBtn.disabled = true;

  try {
    const response = await fetch(sceneItemsApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Fetched Scene Items (HTTP): ${
        data.sceneItems ? data.sceneItems.length : 0
      } items found.`,
    });
    currentSceneItems = data.sceneItems || [];
    populateSourceSelect(data.sceneItems);
    populateFilterSourceSelect(data.sceneItems);
  } catch (error) {
    console.error("Error fetching scene items:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to fetch scene items (HTTP): ${error.message}`,
    });
    sourceSelectEl.innerHTML =
      '<option value="">Failed to load sources</option>';
    filterSourceSelectEl.innerHTML =
      '<option value="">Failed to load sources</option>';
  } finally {
    if (obsConnectionReady) {
      // Only enable if OBS is connected
      sourceSelectEl.disabled = false;
      refreshSourcesBtn.disabled = false;
      filterSourceSelectEl.disabled = false;
      getFiltersBtn.disabled = false; // Enable get filters button
      // Toggle source button state depends on selection
      if (sourceSelectEl.value) toggleSourceBtn.disabled = false;
    }
  }
}

function populateSourceSelect(sceneItems) {
  sourceSelectEl.innerHTML = "";
  if (!sceneItems || sceneItems.length === 0) {
    sourceSelectEl.innerHTML = '<option value="">No Sources in Scene</option>';
    sourceSelectEl.disabled = true;
    toggleSourceBtn.disabled = true;
    return;
  }

  sceneItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.sceneItemId; // Use sceneItemId for direct control
    option.textContent = `${item.sourceName} (${
      item.sceneItemEnabled ? "Visible" : "Hidden"
    })`;
    option.dataset.sourceName = item.sourceName; // Store sourceName for filter fetching
    option.dataset.enabled = item.sceneItemEnabled; // Store current state
    sourceSelectEl.appendChild(option);
  });
  sourceSelectEl.disabled = false;
  if (sourceSelectEl.value) toggleSourceBtn.disabled = false; // Enable toggle if there's a selection
}

// Separate function for filter source select as it's typically a copy of sourceSelect
function populateFilterSourceSelect(sceneItems) {
  filterSourceSelectEl.innerHTML = "";
  if (!sceneItems || sceneItems.length === 0) {
    filterSourceSelectEl.innerHTML =
      '<option value="">No Sources for Filters</option>';
    filterSourceSelectEl.disabled = true;
    getFiltersBtn.disabled = true;
    return;
  }

  // Add a default "Select a source" option if desired
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "--- Select a Source ---";
  filterSourceSelectEl.appendChild(defaultOption);

  sceneItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.sourceName; // Use sourceName for filters
    option.textContent = item.sourceName;
    filterSourceSelectEl.appendChild(option);
  });
  filterSourceSelectEl.disabled = false;
  getFiltersBtn.disabled = false;
}

async function toggleSourceVisibilityApi(
  sceneItemId,
  sourceName,
  currentEnabled
) {
  if (!obsConnectionReady) {
    appendMessage(messagesApiHttpServerEl, {
      warning: "Cannot toggle source: OBS is not connected.",
    });
    return;
  }

  // Get the current scene name from the UI element
  const currentSceneName = currentSceneEl.textContent; // <--- NEW: Get current scene name from UI
  if (!currentSceneName || currentSceneName === "-") {
    appendMessage(messagesApiHttpServerEl, {
      error: "Cannot toggle source: Current scene name not available.",
    });
    return;
  }

  const newEnabled = !currentEnabled; // Toggle the state
  try {
    const response = await fetch(sourceVisibilityApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneName: currentSceneName, // <--- NEW: Add sceneName
        sceneItemId: sceneItemId,
        sourceName, // OBS might use this as a fallback or for logging, safer to include
        sourceEnabled: newEnabled,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Source '${sourceName}' toggled to ${newEnabled} (HTTP).`,
    });
    // The SceneItemEnableStateChanged event from OBS will update the UI, but we can optimistically update
    const selectedOption = sourceSelectEl.querySelector(
      `option[value="${sceneItemId}"]`
    );
    if (selectedOption) {
      selectedOption.textContent = `${sourceName} (${
        newEnabled ? "Visible" : "Hidden"
      })`;
      selectedOption.dataset.enabled = newEnabled.toString();
    }
  } catch (error) {
    console.error("Error toggling source visibility:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to toggle source '${sourceName}' visibility (HTTP): ${error.message}`,
    });
  }
}

async function fetchSourceFiltersApi(sourceName) {
  if (!obsConnectionReady) {
    filterSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
    filterSelectEl.disabled = true;
    toggleFilterBtn.disabled = true;
    return;
  }
  filterSelectEl.innerHTML = '<option value="">Loading Filters...</option>';
  filterSelectEl.disabled = true;
  toggleFilterBtn.disabled = true;

  try {
    const response = await fetch(sourceFiltersApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Fetched Filters for '${sourceName}' (HTTP): ${
        data.filters ? data.filters.length : 0
      } filters found.`,
    });
    currentSourceFilters = data.filters || [];
    populateFilterSelect(data.filters);
  } catch (error) {
    console.error("Error fetching source filters:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to fetch filters for '${sourceName}' (HTTP): ${error.message}`,
    });
    filterSelectEl.innerHTML =
      '<option value="">Failed to load filters</option>';
  } finally {
    if (obsConnectionReady) {
      filterSelectEl.disabled = false;
      if (filterSelectEl.value) toggleFilterBtn.disabled = false;
    }
  }
}

function populateFilterSelect(filters) {
  filterSelectEl.innerHTML = "";
  if (!filters || filters.length === 0) {
    filterSelectEl.innerHTML =
      '<option value="">No Filters for Source</option>';
    filterSelectEl.disabled = true;
    toggleFilterBtn.disabled = true;
    return;
  }

  filters.forEach((filter) => {
    const option = document.createElement("option");
    option.value = filter.filterName;
    option.textContent = `${filter.filterName} (${
      filter.filterEnabled ? "Enabled" : "Disabled"
    })`;
    option.dataset.enabled = filter.filterEnabled; // Store current state
    filterSelectEl.appendChild(option);
  });
  filterSelectEl.disabled = false;
  if (filterSelectEl.value) toggleFilterBtn.disabled = false;
}

async function toggleFilterVisibilityApi(
  sourceName,
  filterName,
  currentEnabled
) {
  if (!obsConnectionReady) {
    appendMessage(messagesApiHttpServerEl, {
      warning: "Cannot toggle filter: OBS is not connected.",
    });
    return;
  }
  const newEnabled = !currentEnabled;
  try {
    const response = await fetch(filterVisibilityApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceName,
        filterName,
        filterEnabled: newEnabled,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    appendMessage(messagesApiHttpServerEl, {
      success: `Filter '${filterName}' on '${sourceName}' toggled to ${newEnabled} (HTTP).`,
    });
    // Optimistically update the UI
    const selectedOption = filterSelectEl.querySelector(
      `option[value="${filterName}"]`
    );
    if (selectedOption) {
      selectedOption.textContent = `${filterName} (${
        newEnabled ? "Enabled" : "Disabled"
      })`;
      selectedOption.dataset.enabled = newEnabled.toString();
    }
  } catch (error) {
    console.error("Error toggling filter visibility:", error);
    appendMessage(messagesApiHttpServerEl, {
      error: `Failed to toggle filter '${filterName}' visibility (HTTP): ${error.message}`,
    });
  }
}

// --- Event Listeners ---
setSceneBtn.addEventListener("click", () => {
  const selectedScene = sceneSelectEl.value;
  if (selectedScene) {
    setSceneApi(selectedScene);
  }
});

refreshScenesBtn.addEventListener("click", fetchScenesApi);

connectProfileBtn.addEventListener("click", () => {
  const selectedProfileId = profileSelectEl.value;
  if (selectedProfileId) {
    selectObsProfileApi(selectedProfileId);
  }
});

refreshProfilesBtn.addEventListener("click", fetchObsProfilesApi);

// NEW: Source Control Event Listeners
refreshSourcesBtn.addEventListener("click", fetchSceneItemsApi);

toggleSourceBtn.addEventListener("click", () => {
  const selectedSourceItemId = sourceSelectEl.value;
  if (selectedSourceItemId) {
    const selectedOption = sourceSelectEl.options[sourceSelectEl.selectedIndex];
    const sourceName = selectedOption.dataset.sourceName; // Get actual source name
    const currentEnabled = selectedOption.dataset.enabled === "true";
    toggleSourceVisibilityApi(
      parseInt(selectedOption.value) || 0,
      sourceName,
      currentEnabled
    );
  }
});

// NEW: Filter Control Event Listeners
filterSourceSelectEl.addEventListener("change", () => {
  const selectedSourceName = filterSourceSelectEl.value;
  if (selectedSourceName) {
    fetchSourceFiltersApi(selectedSourceName);
  } else {
    filterSelectEl.innerHTML = '<option value="">Select Source First</option>';
    filterSelectEl.disabled = true;
    toggleFilterBtn.disabled = true;
  }
});

getFiltersBtn.addEventListener("click", () => {
  const selectedSourceName = filterSourceSelectEl.value;
  if (selectedSourceName) {
    fetchSourceFiltersApi(selectedSourceName);
  } else {
    appendMessage(messagesApiHttpServerEl, {
      warning: "Please select a source to get its filters.",
    });
  }
});

toggleFilterBtn.addEventListener("click", () => {
  const selectedSourceName = filterSourceSelectEl.value;
  const selectedFilterName = filterSelectEl.value;
  if (selectedSourceName && selectedFilterName) {
    const selectedOption = filterSelectEl.options[filterSelectEl.selectedIndex];
    const currentEnabled = selectedOption.dataset.enabled === "true";
    toggleFilterVisibilityApi(
      selectedSourceName,
      selectedFilterName,
      currentEnabled
    );
  } else {
    appendMessage(messagesApiHttpServerEl, {
      warning: "Please select both a source and a filter.",
    });
  }
});

// --- Initial Setup ---
document.addEventListener("DOMContentLoaded", () => {
  fetchObsProfilesApi();
  connectWebSocket();
  // Initially disable source/filter controls until OBS is connected
  sourceSelectEl.disabled = true;
  toggleSourceBtn.disabled = true;
  refreshSourcesBtn.disabled = true;
  filterSourceSelectEl.disabled = true;
  getFiltersBtn.disabled = true;
  filterSelectEl.disabled = true;
  toggleFilterBtn.disabled = true;

  // Default messages
  sourceSelectEl.innerHTML = '<option value="">OBS Not Connected</option>';
  filterSourceSelectEl.innerHTML =
    '<option value="">OBS Not Connected</option>';
  filterSelectEl.innerHTML = '<option value="">Select Source First</option>';
});
