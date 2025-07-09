import { Hono } from "hono";
import {
  connectToObs,
  currentObsProfile,
  dbObsProfiles,
  obsWsConnected,
} from "../obs"; // Assuming 'obs' related imports are at the same level or relative path
import { auth } from "../auth"; // Assuming 'auth' is also relative to 'src'
import { sendObsRequestToBackend } from "..";

// Create a new Hono app instance specifically for API routes
// We need to pass the same Variables type here so that 'c.get("user")' works
export const apiRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();
apiRoutes.get("/obs-status", async (c) => {
  return c.json({
    connected: obsWsConnected,
    currentProfile: currentObsProfile ? currentObsProfile.name : "None",
    currentProfileId: currentObsProfile ? currentObsProfile.id : null,
  });
});

apiRoutes.get("/obs-profiles", async (c) => {
  const profilesForFrontend = dbObsProfiles.map(({ id, name, url }) => ({
    id,
    name,
    url,
  }));
  return c.json(profilesForFrontend);
});

apiRoutes.post("/select-obs-profile", async (c) => {
  const { profileId } = await c.req.json();
  if (!profileId) {
    return c.json({ error: "Missing 'profileId' in request body." }, 400);
  }

  const selectedProfile = dbObsProfiles.find((p) => p.id === profileId);

  if (!selectedProfile) {
    return c.json({ error: `Profile with ID '${profileId}' not found.` }, 404);
  }

  try {
    connectToObs(selectedProfile);
    return c.json({
      success: true,
      message: `Attempting to connect to OBS profile: ${selectedProfile.name}`,
    });
  } catch (error: any) {
    console.error("Error selecting OBS profile:", error);
    return c.json(
      { error: error.message || "Failed to select OBS profile." },
      500
    );
  }
});

apiRoutes.get("/scenes", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const response = await sendObsRequestToBackend("GetSceneList", {});
    return c.json(response);
  } catch (error: any) {
    console.error("Error fetching scenes:", error);
    return c.json({ error: error.message || "Failed to fetch scenes." }, 500);
  }
});

apiRoutes.post("/scenes", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { sceneName } = await c.req.json();
    if (!sceneName) {
      return c.json({ error: "Missing 'sceneName' in request body." }, 400);
    }
    const response = await sendObsRequestToBackend("SetCurrentProgramScene", {
      sceneName,
    });
    return c.json({ success: true, sceneName, response });
  } catch (error: any) {
    console.error("Error setting scene:", error);
    return c.json({ error: error.message || "Failed to set scene." }, 500);
  }
});

apiRoutes.get("/scene-items", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }

    const currentSceneResponse = await sendObsRequestToBackend(
      "GetCurrentProgramScene",
      {}
    );
    const currentSceneName = currentSceneResponse.sceneName;

    if (!currentSceneName) {
      return c.json(
        { error: "Could not retrieve current program scene name from OBS." },
        500
      );
    }

    const sceneItemsResponse = await sendObsRequestToBackend(
      "GetSceneItemList",
      {
        sceneName: currentSceneName,
      }
    );

    return c.json(sceneItemsResponse);
  } catch (error: any) {
    console.error("Error fetching scene items:", error);
    return c.json(
      { error: error.message || "Failed to fetch scene items." },
      500
    );
  }
});

apiRoutes.post("/source-visibility", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { sceneItemId, sceneName, sourceName, sourceEnabled } =
      await c.req.json();
    if (sourceEnabled === undefined || typeof sourceEnabled !== "boolean") {
      return c.json(
        {
          error: "Missing or invalid 'sourceEnabled' boolean in request body.",
        },
        400
      );
    }

    const requestData: any = { sceneItemEnabled: sourceEnabled };
    if (sceneName !== undefined) requestData.sceneName = sceneName;
    requestData.sceneItemId = sceneItemId;
    if (sourceName !== undefined) requestData.sourceName = sourceName;

    const response = await sendObsRequestToBackend(
      "SetSceneItemEnabled",
      requestData
    );

    return c.json({
      success: true,
      sourceName: sourceName || sceneName,
      sourceEnabled,
      response,
    });
  } catch (error: any) {
    console.error("Error toggling source visibility:", error);
    return c.json(
      { error: error.message || "Failed to toggle source visibility." },
      500
    );
  }
});

apiRoutes.post("/source-filters", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { sourceName } = await c.req.json();
    if (!sourceName) {
      return c.json({ error: "Missing 'sourceName' in request body." }, 400);
    }
    const response = await sendObsRequestToBackend("GetSourceFilterList", {
      sourceName,
    });
    return c.json(response);
  } catch (error: any) {
    console.error("Error fetching source filters:", error);
    return c.json(
      { error: error.message || "Failed to fetch source filters." },
      500
    );
  }
});

apiRoutes.post("/filter-visibility", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { sourceName, filterName, filterEnabled } = await c.req.json();
    if (!sourceName || !filterName) {
      return c.json(
        { error: "Missing 'sourceName' or 'filterName' in request body." },
        400
      );
    }
    if (filterEnabled === undefined || typeof filterEnabled !== "boolean") {
      return c.json(
        {
          error: "Missing or invalid 'filterEnabled' boolean in request body.",
        },
        400
      );
    }

    const response = await sendObsRequestToBackend("SetSourceFilterEnabled", {
      sourceName,
      filterName,
      filterEnabled,
    });
    return c.json({
      success: true,
      sourceName,
      filterName,
      filterEnabled,
      response,
    });
  } catch (error: any) {
    console.error("Error toggling filter visibility:", error);
    return c.json(
      { error: error.message || "Failed to toggle filter visibility." },
      500
    );
  }
});

apiRoutes.get("/audio-inputs", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const response = await sendObsRequestToBackend("GetInputList", {});
    const audioInputs = response.inputs.filter(
      (input: any) =>
        input.inputKind.includes("audio") ||
        input.unversionedInputKind.includes("audio")
    );
    return c.json({ audioInputs: response.inputs });
  } catch (error: any) {
    console.error("Error fetching audio inputs:", error);
    return c.json(
      { error: error.message || "Failed to fetch audio inputs." },
      500
    );
  }
});

apiRoutes.post("/audio-input/volume-mute", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { inputName } = await c.req.json();
    if (!inputName) {
      return c.json({ error: "Missing 'inputName' in request body." }, 400);
    }
    const response = await sendObsRequestToBackend("GetInputVolume", {
      inputName,
    });
    const responseMute = await sendObsRequestToBackend("GetInputMute", {
      inputName,
    });
    return c.json({ ...response, inputMuted: responseMute.inputMuted });
  } catch (error: any) {
    console.error("Error fetching audio input volume/mute:", error);
    return c.json(
      { error: error.message || "Failed to fetch audio input volume/mute." },
      500
    );
  }
});

apiRoutes.post("/audio-input/set-volume", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { inputName, inputVolumeDb, inputVolumeMul } = await c.req.json();
    if (
      !inputName ||
      (inputVolumeDb === undefined && inputVolumeMul === undefined)
    ) {
      return c.json(
        {
          error:
            "Missing 'inputName' and 'inputVolumeDb' or 'inputVolumeMul' in request body.",
        },
        400
      );
    }
    const requestData: any = { inputName };
    if (inputVolumeDb !== undefined) requestData.inputVolumeDb = inputVolumeDb;
    if (inputVolumeMul !== undefined)
      requestData.inputVolumeMul = inputVolumeMul;

    const response = await sendObsRequestToBackend(
      "SetInputVolume",
      requestData
    );
    return c.json({ success: true, inputName, response });
  } catch (error: any) {
    console.error("Error setting audio input volume:", error);
    return c.json(
      { error: error.message || "Failed to set audio input volume." },
      500
    );
  }
});

apiRoutes.post("/audio-input/set-muted", async (c) => {
  try {
    if (!obsWsConnected) {
      return c.json({ error: "OBS WebSocket is not connected." }, 503);
    }
    const { inputName, inputMuted } = await c.req.json();
    if (
      !inputName ||
      inputMuted === undefined ||
      typeof inputMuted !== "boolean"
    ) {
      return c.json(
        {
          error:
            "Missing 'inputName' or invalid 'inputMuted' boolean in request body.",
        },
        400
      );
    }
    const response = await sendObsRequestToBackend("SetInputMute", {
      inputName,
      inputMuted,
    });
    return c.json({ success: true, inputName, inputMuted, response });
  } catch (error: any) {
    console.error("Error setting audio input mute state:", error);
    return c.json(
      { error: error.message || "Failed to set audio input mute state." },
      500
    );
  }
});

// Export the Hono instance so it can be imported and mounted in index.ts
export default apiRoutes;
