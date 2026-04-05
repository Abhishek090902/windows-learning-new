import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MentorLayout from '@/components/MentorLayout';
import { ArrowLeft, IndianRupee, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useMentorProposals, useRequirement, useSubmitProposal } from '@/hooks/useApi';

const MentorRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: requirement, isLoading } = useRequirement(id!);
  const { data: myProposals = [] } = useMentorProposals();
  const submitProposal = useSubmitProposal();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');

  if (isLoading) {
    return (
      <MentorLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MentorLayout>
    );
  }

  if (!requirement) {
    return (
      <MentorLayout>
        <div className="p-6 md:p-8">
          <Card><CardContent className="p-8 text-center text-muted-foreground">Requirement not found.</CardContent></Card>
        </div>
      </MentorLayout>
    );
  }

  const alreadySubmitted = myProposals.some((proposal: any) => proposal.requirementId === requirement.id && proposal.isActive);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitProposal.mutateAsync({
        requirementId: requirement.id,
        coverLetter,
        proposedRate: Number(proposedRate),
      });
      toast({
        title: 'Proposal sent',
        description: 'Your proposal has been submitted successfully.',
      });
      setCoverLetter('');
      setProposedRate('');
    } catch (error: any) {
      toast({
        title: 'Unable to submit proposal',
        description: error.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/mentor/requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{requirement.title}</h1>
            <p className="text-muted-foreground">Review the learner request and send your proposal.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <IndianRupee className="h-3 w-3 mr-1" />
                  {Number(requirement.budget || 0).toLocaleString('en-IN')}
                </Badge>
                <Badge variant="outline">
                  {requirement._count?.proposals || 0} proposals
                </Badge>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{requirement.description}</p>
              <div className="text-sm text-muted-foreground">
                Posted by <span className="font-medium text-foreground">{requirement.learner?.user?.name || 'Learner'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submit Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              {alreadySubmitted ? (
                <div className="rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
                  You already submitted a proposal for this request. Check <Link to="/mentor/proposals" className="text-primary hover:underline">My Proposals</Link> for its status.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Bid (INR)</label>
                    <input
                      type="number"
                      min="1"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border bg-background text-sm"
                      placeholder="Enter your proposed session rate"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Letter</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full min-h-36 px-3 py-3 rounded-lg border bg-background text-sm"
                      placeholder="Explain how you can help the learner and what your approach will be."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitProposal.isPending}>
                    {submitProposal.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Proposal
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorRequestDetail;
