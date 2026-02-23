import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const useSocket = (url, events) => {
    const { token } = useAuthStore();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        
        socketRef.current = io(url || 'http://localhost:8000', {
            auth: { token },
            transports: ['websocket'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to real-time events');
        });

        
        if (events) {
            Object.keys(events).forEach((event) => {
                socket.on(event, events[event]);
            });
        }

        return () => {
            if (socket) {
                if (events) {
                    Object.keys(events).forEach((event) => {
                        socket.off(event, events[event]);
                    });
                }
                socket.disconnect();
            }
        };
    }, [token, url, events]);

    return socketRef.current;
};
