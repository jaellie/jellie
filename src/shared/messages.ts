import { InteractionType } from "./types";

// Runtime messages sent from the content script to the background service
// worker. Deliberately minimal: only "an interaction of this type happened"
// — never any page content, clicked text, or typed values.
export interface InteractionMessage {
  type: "PAWPRINT_INTERACTION";
  interaction: InteractionType;
}

export type PawprintMessage = InteractionMessage;
