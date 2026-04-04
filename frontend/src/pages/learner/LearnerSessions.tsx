import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Star, MessageSquare, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LearnerLayout from '@/components/LearnerLayout';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import { useLearnerSessions } from '@/hooks/useApi';
import { format } from 'date-fns';
import { getChatRoute } from '@/lib/appRoutes';

type Tab = 'upcoming' | 'past' | 'cancelled';

const LearnerSessions = () => {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [activeMeetingSessionId, setActiveMeetingSessionId] = useState<string | null>(null);
  const { data: sessions = [], isLoading } = useLearnerSessions();

  const filteredSessions = sessions.filter((s: any) => {
    if (tab === 'upcoming') return s.status === 'CONFIRMED' || s.status === 'PENDING' || s.status === 'ONGOING';
    if (tab === 'past') return s.status === 'COMPLETED';
    if (tab === 'cancelled') return s.status === 'CANCELLED';
    return false;
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: sessions.filter((s: any) => s.status === 'CONFIRMED' || s.status === 'PENDING' || s.status === 'ONGOING').length },
    { key: 'past', label: 'Past', count: sessions.filter((s: any) => s.status === 'COMPLETED').length },
    { key: 'cancelled', label: 'Cancelled', count: sessions.filter((s: any) => s.status === 'CANCELLED').length },
  ];

  if (isLoading) {
    return (
      <LearnerLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">My Sessions</h1>
        <p className="text-muted-foreground mb-6">Manage your mentoring sessions</p>

        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSessions.map((session: any) => (
            <Card key={session.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {session.mentor?.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/mentor/${session.mentorId}`} className="font-semibold hover:text-primary">{session.mentor?.user?.name}</Link>
                    <p className="text-sm text-muted-foreground">{session.status}</p>
                    {session.status === 'PENDING' && (
                      <p className="text-xs text-amber-700 mt-1">Waiting for mentor acceptance before you can join.</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(session.startTime), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(session.startTime), 'HH:mm')}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {tab === 'upcoming' && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={session.status === 'PENDING'}
                          onClick={() => setActiveMeetingSessionId(session.id)}
                        >
                          <Video className="h-3 w-3" /> Join Session
                        </Button>
                        <Link to={getChatRoute(session.mentor?.user?.id || session.mentorId)}><Button size="sm" variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" /> Chat</Button></Link>
                        <Link to="/support/ticket"><Button size="sm" variant="outline" className="gap-1"><RotateCcw className="h-3 w-3" /> Reschedule</Button></Link>
                      </div>
                    )}
                    {tab === 'past' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="gap-1"><Star className="h-3 w-3" /> Review</Button>
                        <Button size="sm" variant="outline" className="gap-1"><Download className="h-3 w-3" /> Notes</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredSessions.length === 0 && (
            <div className="text-center py-12 border rounded-xl bg-secondary/20">
              <p className="text-muted-foreground">No {tab} sessions found.</p>
            </div>
          )}
        </div>
      </div>
      <MeetingRoom
        sessionId={activeMeetingSessionId || ''}
        isOpen={Boolean(activeMeetingSessionId)}
        onClose={() => setActiveMeetingSessionId(null)}
      />
    </LearnerLayout>
  );
};

export default LearnerSessions;
