import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueEntry } from '../types';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io('/', { path: '/socket.io', transports: ['websocket'] });
  }
  return socket;
}

export function useQueueSocket(
  roomId: string | null,
  date: string | null,
  onUpdate: (entries: QueueEntry[]) => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!roomId) return;

    const s = getSocket();

    s.emit('join-queue', { roomId, date });

    const handler = (data: QueueEntry[]) => {
      onUpdateRef.current(data);
    };

    s.on('queue:updated', handler);

    return () => {
      s.off('queue:updated', handler);
      s.emit('leave-queue', { roomId, date });
    };
  }, [roomId, date]);

  const emitJoin = useCallback((rId: string, d?: string) => {
    getSocket().emit('join-queue', { roomId: rId, date: d });
  }, []);

  return { emitJoin };
}
