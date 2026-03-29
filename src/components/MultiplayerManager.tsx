import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { remotePlayersState, localPlayerState } from './store';
import { RemotePlayer } from './RemotePlayer';

import { Html } from '@react-three/drei';

export function MultiplayerManager() {
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [isServerFull, setIsServerFull] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('serverFull', () => {
      setIsServerFull(true);
      socket.disconnect();
    });

    socket.on('currentPlayers', (currentPlayers) => {
      // Set local player color
      if (currentPlayers[socket.id!]) {
        localPlayerState.color = currentPlayers[socket.id!].color;
      }

      // Remove ourselves from the remote players list
      const remotePlayers = { ...currentPlayers };
      delete remotePlayers[socket.id!];
      
      Object.assign(remotePlayersState, remotePlayers);
      setPlayers({ ...remotePlayersState });
    });

    socket.on('newPlayer', (playerInfo) => {
      if (playerInfo.id !== socket.id) {
        remotePlayersState[playerInfo.id] = playerInfo;
        setPlayers({ ...remotePlayersState });
      }
    });

    socket.on('playerDisconnected', (playerId) => {
      delete remotePlayersState[playerId];
      setPlayers({ ...remotePlayersState });
    });

    socket.on('playerMoved', (playerInfo) => {
      if (playerInfo.id !== socket.id) {
        // Update the state object directly for performance
        // The RemotePlayer component will read from this object
        if (remotePlayersState[playerInfo.id]) {
          remotePlayersState[playerInfo.id].x = playerInfo.x;
          remotePlayersState[playerInfo.id].y = playerInfo.y;
          remotePlayersState[playerInfo.id].z = playerInfo.z;
          remotePlayersState[playerInfo.id].rotation = playerInfo.rotation;
          
          // Only trigger a re-render if the action changes (for animations)
          if (remotePlayersState[playerInfo.id].action !== playerInfo.action) {
            remotePlayersState[playerInfo.id].action = playerInfo.action;
            setPlayers({ ...remotePlayersState });
          }
        }
      }
    });

    return () => {
      socket.off('serverFull');
      socket.off('currentPlayers');
      socket.off('newPlayer');
      socket.off('playerDisconnected');
      socket.off('playerMoved');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const count = Object.keys(players).length + 1;
    window.dispatchEvent(new CustomEvent('playerCountChange', { detail: count }));
  }, [players]);

  return (
    <group>
      {isServerFull && (
        <Html center>
          <div className="bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border border-red-400 text-center w-80">
            <h2 className="text-xl font-bold mb-2">Servidor Cheio</h2>
            <p>O limite de 3 jogadores foi atingido. Você está jogando offline.</p>
          </div>
        </Html>
      )}
      {Object.values(players).map((player) => (
        <RemotePlayer key={player.id} id={player.id} playerState={remotePlayersState[player.id]} />
      ))}
    </group>
  );
}
