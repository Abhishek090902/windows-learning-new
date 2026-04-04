import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, MessageSquare, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MentorLayout from '@/components/MentorLayout';
import { useMentorProposals } from '@/hooks/useApi';
import { appRoutes, getChatRoute } from '@/lib/appRoutes';

const MentorProposals = () => {
  const [tab, setTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const { data: proposals = [], isLoading } = useMentorProposals();

  const filteredProposals = proposals.filter((proposal: any) => {
    if (tab === 'pending') return proposal.isActive && !proposal.isAccepted;
    if (tab === 'accepted') return proposal.isAccepted;
    return !proposal.isActive && !proposal.isAccepted;
  });

  const tabs = [
    { key: 'pending', label: 'Pending', count: proposals.filter((proposal: any) => proposal.isActive && !proposal.isAccepted).length, icon: Clock },
    { key: 'accepted', label: 'Accepted', count: proposals.filter((proposal: any) => proposal.isAccepted).length, icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', count: proposals.filter((proposal: any) => !proposal.isActive && !proposal.isAccepted).length, icon: XCircle },
  ] as const;

  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">My Proposals</h1>
        <p className="text-muted-foreground mb-6">Track your proposal submissions and next actions.</p>

        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${tab === tabItem.key ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tabItem.label} ({tabItem.count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal: any) => (
              <Card key={proposal.id}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{proposal.requirement?.title || 'Learning request'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bid: Rs {Number(proposal.proposedRate || 0).toLocaleString('en-IN')} • Submitted: {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Learner: {proposal.requirement?.learner?.user?.name || 'Learner'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {tab === 'pending' && (
                      <Button variant="outline" size="sm" disabled>
                        Awaiting Response
                      </Button>
                    )}

                    {tab === 'accepted' && (
                      <>
                        <Link to={getChatRoute(proposal.requirement?.learner?.user?.id || '')}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <MessageSquare className="h-3 w-3" /> Message
                          </Button>
                        </Link>
                        <Link to={appRoutes.mentorSessions}>
                          <Button size="sm" className="gap-1">
                            <Video className="h-3 w-3" /> Sessions
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredProposals.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                No {tab} proposals found.
              </div>
            )}
          </div>
        )}
      </div>
    </MentorLayout>
  );
};

export default MentorProposals;
