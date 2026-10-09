import { loadRoom, saveRoom } from './storage';

const ROOM_PATTERN = /room=([\w-]{20,})/;

export function roomFromUrl(): string | null {
  return location.hash.match(ROOM_PATTERN)?.[1] ?? null;
}

/** 추측할 수 없는 22자 무작위 방 ID */
function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 공유 링크로 들어왔으면 그 방을, 아니면 이 기기에 저장된 방을, 둘 다 없으면 새 방을 쓴다.
 * created가 true면 새로 만든 방이다.
 */
export function resolveRoom(): { roomId: string; created: boolean } {
  let roomId = roomFromUrl();
  let created = false;
  if (!roomId) {
    roomId = loadRoom();
    if (!roomId) {
      roomId = newRoomId();
      created = true;
    }
    history.replaceState(null, '', `#room=${roomId}`);
  }
  saveRoom(roomId);
  return { roomId, created };
}

export function shareUrl(roomId: string): string {
  return `${location.origin}${location.pathname}#room=${roomId}`;
}
