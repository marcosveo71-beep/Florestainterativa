import { io } from 'socket.io-client';

// Connect manually after components mount to avoid missing events during Suspense
export const socket = io({ autoConnect: false });
