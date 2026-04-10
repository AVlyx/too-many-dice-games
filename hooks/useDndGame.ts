"use client";

import { useReducer, useRef } from "react";
import type { TmdPlayer } from "too-many-dice";
import type {
  CharacterProfile,
  RollConfig,
  RollPreset,
  RollResult,
  ActiveRequest,
  NpcEntry,
} from "@/engine/dnd/types";

export interface DndState {
  players: TmdPlayer[];
  characterProfiles: Record<string, CharacterProfile>;
  npcs: NpcEntry[];
  rollHistory: RollResult[];
  activeRequests: ActiveRequest[];
  dmPresets: RollPreset[];
  playerPresets: Record<string, RollPreset[]>;
  rollConfig: RollConfig;
  rollTarget: "all" | string;
  rollVisibility: "public" | "private";
}

const DEFAULT_ROLL_CONFIG: RollConfig = {
  label: "",
  dice: [{ count: 1, diceType: "d20" }],
  modifier: { type: "none" },
  extraBonus: 0,
  rollType: "normal",
  dc: undefined,
};

const INITIAL_STATE: DndState = {
  players: [],
  characterProfiles: {},
  npcs: [],
  rollHistory: [],
  activeRequests: [],
  dmPresets: [],
  playerPresets: {},
  rollConfig: DEFAULT_ROLL_CONFIG,
  rollTarget: "all",
  rollVisibility: "public",
};

export type DndAction =
  | { type: "PLAYER_JOINED"; player: TmdPlayer }
  | { type: "PLAYER_LEFT"; playerId: string }
  | { type: "PROFILE_COLLECTED"; playerId: string; profile: CharacterProfile }
  | { type: "ROLL_REQUESTED"; request: ActiveRequest }
  | { type: "ROLL_RECEIVED"; result: RollResult }
  | { type: "ROLL_REQUEST_DONE"; requestId: string }
  | { type: "DM_PRESET_SAVED"; preset: RollPreset }
  | { type: "DM_PRESET_DELETED"; presetId: string }
  | { type: "PLAYER_PRESET_SAVED"; playerId: string; preset: RollPreset }
  | { type: "NPC_ADDED"; npc: NpcEntry }
  | { type: "NPC_REMOVED"; npcId: string }
  | { type: "SET_ROLL_CONFIG"; config: Partial<RollConfig> }
  | { type: "SET_ROLL_TARGET"; target: string }
  | { type: "SET_ROLL_VISIBILITY"; visibility: "public" | "private" }
  | { type: "LOAD_PRESET"; config: RollConfig };

function reducer(state: DndState, action: DndAction): DndState {
  switch (action.type) {
    case "PLAYER_JOINED":
      if (state.players.find((p) => p.playerId === action.player.playerId)) {
        return state;
      }
      return {
        ...state,
        players: [...state.players, action.player],
        playerPresets: { ...state.playerPresets, [action.player.playerId]: [] },
      };

    case "PLAYER_LEFT":
      return {
        ...state,
        players: state.players.filter((p) => p.playerId !== action.playerId),
        activeRequests: state.activeRequests.filter(
          (r) => r.playerId !== action.playerId
        ),
      };

    case "PROFILE_COLLECTED":
      return {
        ...state,
        characterProfiles: {
          ...state.characterProfiles,
          [action.playerId]: action.profile,
        },
      };

    case "ROLL_REQUESTED":
      return {
        ...state,
        activeRequests: [...state.activeRequests, action.request],
      };

    case "ROLL_RECEIVED":
      return {
        ...state,
        rollHistory: [action.result, ...state.rollHistory],
      };

    case "ROLL_REQUEST_DONE":
      return {
        ...state,
        activeRequests: state.activeRequests.filter(
          (r) => r.id !== action.requestId
        ),
      };

    case "DM_PRESET_SAVED":
      return { ...state, dmPresets: [...state.dmPresets, action.preset] };

    case "DM_PRESET_DELETED":
      return {
        ...state,
        dmPresets: state.dmPresets.filter((p) => p.id !== action.presetId),
      };

    case "PLAYER_PRESET_SAVED": {
      const existing = state.playerPresets[action.playerId] ?? [];
      return {
        ...state,
        playerPresets: {
          ...state.playerPresets,
          [action.playerId]: [...existing, action.preset],
        },
      };
    }

    case "NPC_ADDED":
      return {
        ...state,
        npcs: [...state.npcs, action.npc],
        characterProfiles: {
          ...state.characterProfiles,
          [action.npc.id]: action.npc.profile,
        },
      };

    case "NPC_REMOVED": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.npcId]: _removed, ...rest } = state.characterProfiles;
      return {
        ...state,
        npcs: state.npcs.filter((n) => n.id !== action.npcId),
        characterProfiles: rest,
      };
    }

    case "SET_ROLL_CONFIG":
      return {
        ...state,
        rollConfig: { ...state.rollConfig, ...action.config },
      };

    case "SET_ROLL_TARGET":
      return { ...state, rollTarget: action.target };

    case "SET_ROLL_VISIBILITY":
      return { ...state, rollVisibility: action.visibility };

    case "LOAD_PRESET":
      return { ...state, rollConfig: action.config };

    default:
      return state;
  }
}

export function useDndGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  return { state, dispatch, stateRef };
}
