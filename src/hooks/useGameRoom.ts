import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from './use-toast';

export interface GameRoom {
  id: string;
  event_id: string;
  game_type: string;
  room_code: string;
  host_id: string;
  theme?: string;
  game_state: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameParticipant {
  id: string;
  room_id: string;
  participant_name: string;
  participant_id?: string;
  score: number;
  joined_at: string;
}

export const useGameRoom = (roomCode?: string) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRoom = async (eventId: string, gameType: string, hostId: string, theme?: string) => {
    setLoading(true);
    try {
      const code = generateRoomCode();
      const { data, error } = await (supabase as any)
        .from('game_rooms')
        .insert({
          event_id: eventId,
          game_type: gameType,
          room_code: code,
          host_id: hostId,
          theme,
          game_state: {},
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setRoom(data);
      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create game room',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, participantName: string, participantId?: string) => {
    setLoading(true);
    try {
      // First, find the room
      const { data: roomData, error: roomError } = await (supabase as any)
        .from('game_rooms')
        .select('*')
        .eq('room_code', code)
        .eq('is_active', true)
        .single();

      if (roomError) throw new Error('Room not found');
      
      // Then join as participant
      const { data, error } = await (supabase as any)
        .from('game_room_participants')
        .insert({
          room_id: roomData.id,
          participant_name: participantName,
          participant_id: participantId,
          score: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Name already taken in this room');
        }
        throw error;
      }

      setRoom(roomData);
      toast({
        title: 'Success',
        description: 'Joined game room!',
      });
      return { room: roomData, participant: data };
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join room',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateGameState = async (roomId: string, gameState: any) => {
    try {
      const { error } = await (supabase as any)
        .from('game_rooms')
        .update({ game_state: gameState })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  };

  const updateParticipantScore = async (participantId: string, score: number) => {
    try {
      const { error } = await (supabase as any)
        .from('game_room_participants')
        .update({ score })
        .eq('id', participantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const leaveRoom = async (participantId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('game_room_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const endRoom = async (roomId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('game_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error ending room:', error);
    }
  };

  useEffect(() => {
    if (!roomCode) return;

    const fetchRoomAndParticipants = async () => {
      const { data: roomData } = await (supabase as any)
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomData) {
        setRoom(roomData);
        
        const { data: participantsData } = await (supabase as any)
          .from('game_room_participants')
          .select('*')
          .eq('room_id', roomData.id);

        if (participantsData) {
          setParticipants(participantsData);
        }
      }
    };

    fetchRoomAndParticipants();

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`game_room_${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as GameRoom);
          }
        }
      )
      .subscribe();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`game_participants_${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_room_participants',
        },
        () => {
          fetchRoomAndParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [roomCode]);

  return {
    room,
    participants,
    loading,
    createRoom,
    joinRoom,
    updateGameState,
    updateParticipantScore,
    leaveRoom,
    endRoom,
  };
};
