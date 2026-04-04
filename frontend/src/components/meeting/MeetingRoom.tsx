import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, VideoOff } from 'lucide-react';

type MeetingPayload = {
  sessionId: string;
  roomName: string;
  roomUrl: string;
  autoEndAt: string;
  isOwner: boolean;
  provider: 'JITSI';
  sessionStatus: string;
};

type MeetingRoomProps = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onEnded?: () => void;
};

const MeetingRoom = ({ sessionId, isOpen, onClose, onEnded }: MeetingRoomProps) => {
  const [meeting, setMeeting] = useState<MeetingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingMs = useMemo(() => {
    if (!meeting?.autoEndAt) return null;
    return Math.max(new Date(meeting.autoEndAt).getTime() - Date.now(), 0);
  }, [meeting?.autoEndAt]);

  const meetingUrl = useMemo(() => {
    if (!meeting?.roomUrl) return '';
    return meeting.roomUrl;
  }, [meeting?.roomUrl]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    api.get(`/sessions/${sessionId}/meeting`)
      .then((response) => {
        if (!mounted) return;
        setMeeting(response.data.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.error || err.message || 'Could not start the meeting.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isOpen || !meeting || remainingMs == null) return;
    const timeout = window.setTimeout(async () => {
      try {
        if (meeting.isOwner) {
          await api.post(`/sessions/${sessionId}/end-meeting`);
          onEnded?.();
        }
      } catch {
        // ignore
      } finally {
        onClose();
      }
    }, remainingMs);

    return () => window.clearTimeout(timeout);
  }, [isOpen, meeting, onClose, onEnded, remainingMs, sessionId]);

  const handleClose = async () => {
    try {
      if (meeting?.isOwner) {
        await api.post(`/sessions/${sessionId}/end-meeting`);
        onEnded?.();
      }
    } catch {
      // best effort
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden border flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold">Live Session</h2>
            <p className="text-xs text-muted-foreground">
              Jitsi video, screen sharing, and chat are enabled for this session.
            </p>
          </div>
          <Button variant="outline" onClick={handleClose}>End Session</Button>
        </div>

        <div className="flex-1 min-h-0 p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Preparing your video room...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md text-center">
                <VideoOff className="h-10 w-10 mx-auto mb-3 text-destructive" />
                <h3 className="font-semibold mb-2">Unable to join session</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  If the embedded call has trouble connecting, open the meeting directly in a new tab.
                </p>
                <Button variant="outline" asChild>
                  <a href={meetingUrl} target="_blank" rel="noreferrer">
                    Open in New Tab
                  </a>
                </Button>
              </div>
              <iframe
                src={meetingUrl}
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                className="w-full flex-1 min-h-0 border-0 rounded-2xl bg-black"
                title="Video Session"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
