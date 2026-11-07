import { LiveTimingState } from '@livetiming/shared';

export type WaitReason = 'no-session' | 'unreachable';

/**
 * Why the feed has nothing to show and no recording to play instead (production between
 * sessions), or null when it has something. The screen says why in place of the timing, and the
 * header drops its session details.
 */
export function getWaitReason(state: LiveTimingState): WaitReason | null {
  const feed = state.feedStatus;
  return feed === 'no-session' || feed === 'unreachable' ? feed : null;
}
