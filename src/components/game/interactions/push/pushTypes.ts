export type PushInteractionState = {
    active: boolean;
    facingDirection: 1 | -1;
};

export const DEFAULT_PUSH_INTERACTION_STATE: PushInteractionState = {
    active: false,
    facingDirection: 1,
};