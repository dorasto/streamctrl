export interface RelayConnectionStatusUpdateMessage {
  type: "RELAY_CONNECTION_STATUS";
  data: {
    profile: {
      active: boolean;
      id: string;
      name: string;
    };
    clientId: string;
  };
}
export interface RelayConnectionUpdateActions {
  type: "RELAY_CONNECTION_UPDATE_ACTIONS";
}
export interface RelayProfileListUpdateMessage {
  type: "RELAY_PROFILE_LIST";
  profiles: {
    active: boolean;
    id: string;
    name: string;
  }[];
}

export interface ObsConnectionStatusMessage {
  type: "OBS_CONNECTION_STATUS";
  data: {
    comment?: string; // Optional, like "Switching profiles"
    connection: "identified" | "disconnected"; // More specific string literals
    profile?: string; // Only present when connection is "identified"
  };
}
export interface ObsMessage {
  type: "OBS_MESSAGE";
  data: {
    d: {
      eventData: any;
      eventIntent: number;
      eventType: string;
    };
    op: number;
  };
}

export type WebSocketMessage =
  | RelayConnectionStatusUpdateMessage
  | RelayProfileListUpdateMessage
  | ObsConnectionStatusMessage
  | ObsMessage
  | RelayConnectionUpdateActions;

export interface WebSocketUnknownMessageStructure {
  type: string;
  [key: string]: any;
}
