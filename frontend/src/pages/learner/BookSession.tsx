import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addMinutes, format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Loader2, MessageSquare, Wallet } from 'lucide-react';
import LearnerLayout from '@/components/LearnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBookSession, useWallet, useWalletConfig } from '@/hooks/useApi';
import api from '@/lib/api';
import { appRoutes, getChatRoute } from '@/lib/appRoutes';

type MentorProfile = {
  id: string;
  fullName: string;
  headline?: string;
  hourlyRate?: number;
  currency?: string;
  timeZone?: string;
  weeklySchedule?: Record<string, string[]>;
  averageRating?: number;
  totalReviews?: number;
  user?: {
    id: string;
    name?: string;
  };
};

const formatScheduleValue = (slots: string[] = []) => {
  if (!slots.length) return 'Unavailable';
  return slots.join(', ');
};

const BookSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: wallet } = useWallet();
  const { data: walletConfig } = useWalletConfig();
  const bookSession = useBookSession();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [isLoadingMentor, setIsLoadingMentor] = useState(true);
  const [dateTime, setDateTime] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setIsLoadingMentor(true);

    api.get(`/mentor-profiles/${id}`)
      .then((response) => {
        if (!mounted) return;
        setMentor(response.data.data);
      })
      .catch((error) => {
        if (!mounted) return;
        toast({
          title: 'Unable to load mentor',
          description: error.response?.data?.error || 'Please try again.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (mounted) setIsLoadingMentor(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const price = Number(mentor?.hourlyRate || 0);
  const currency = mentor?.currency || 'INR';
  const walletBalance = Number(wallet?.balance || 0);
  const hasEnoughBalance = walletBalance >= price;
  const paymentTestingMode = (walletConfig?.supportedDepositProviders?.length || 0) === 0;

  const selectedStart = useMemo(() => {
    return dateTime ? new Date(dateTime) : null;
  }, [dateTime]);

  const selectedEnd = useMemo(() => {
    return selectedStart ? addMinutes(selectedStart, 60) : null;
  }, [selectedStart]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!id || !selectedStart || !selectedEnd) {
      toast({
        title: 'Choose a valid start time',
        variant: 'destructive',
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: 'Topic is required',
        description: 'Tell the mentor what you want to work on.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await bookSession.mutateAsync({
        mentorId: id,
        startTime: selectedStart.toISOString(),
        endTime: selectedEnd.toISOString(),
        topic: topic.trim(),
      });

      toast({
        title: paymentTestingMode ? 'Test booking confirmed' : 'Session booked',
        description: paymentTestingMode
          ? 'Payment is temporarily skipped for testing, and the session is confirmed instantly.'
          : 'Your booking has been created and the amount is held in your wallet.',
      });
      navigate(appRoutes.learnerSessions);
    } catch (error: unknown) {
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast({
        title: 'Booking failed',
        description: message || 'Please try another time slot.',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingMentor) {
    return (
      <LearnerLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LearnerLayout>
    );
  }

  if (!mentor) {
    return (
      <LearnerLayout>
        <div className="p-6 md:p-8 max-w-3xl">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg font-semibold">Mentor not found</p>
              <p className="text-sm text-muted-foreground">The booking page could not load this mentor.</p>
              <Link to={appRoutes.mentors}><Button>Browse Mentors</Button></Link>
            </CardContent>
          </Card>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="p-6 md:p-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/mentor/${mentor.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Book Session</h1>
            <p className="text-muted-foreground">Reserve a 60-minute live session with {mentor.fullName || mentor.user?.name}.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full h-11 px-3 rounded-lg border bg-background text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration</label>
                    <div className="h-11 px-3 rounded-lg border bg-muted/40 text-sm flex items-center">
                      60 minutes
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Session Topic</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Example: React interview prep, UI review, portfolio feedback, Python debugging..."
                    className="w-full min-h-32 px-3 py-3 rounded-lg border bg-background text-sm"
                    required
                  />
                </div>

                <div className="rounded-xl border bg-secondary/20 p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-primary" />
                    Session summary
                  </div>
                  <p>
                    Mentor: <span className="font-medium">{mentor.fullName || mentor.user?.name}</span>
                  </p>
                  <p>
                    Time zone: <span className="font-medium">{mentor.timeZone || 'Asia/Kolkata'}</span>
                  </p>
                  {selectedStart && selectedEnd ? (
                    <p>
                      Slot: <span className="font-medium">{format(selectedStart, 'PPP p')} - {format(selectedEnd, 'p')}</span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Choose a start time to preview the slot.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={bookSession.isPending}>
                    {bookSession.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Booking
                  </Button>
                  {mentor.user?.id ? (
                    <Button type="button" variant="outline" asChild>
                      <Link to={getChatRoute(mentor.user.id)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Mentor
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{mentor.fullName || mentor.user?.name}</p>
                  {mentor.headline ? <p className="text-sm text-muted-foreground">{mentor.headline}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currency} {price}/hour</Badge>
                  {mentor.averageRating ? (
                    <Badge variant="outline">
                      {mentor.averageRating.toFixed(1)} rating
                    </Badge>
                  ) : null}
                  {mentor.totalReviews ? (
                    <Badge variant="outline">{mentor.totalReviews} reviews</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {paymentTestingMode ? 'Testing Mode' : 'Wallet Check'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {paymentTestingMode ? (
                  <div className="rounded-lg p-3 bg-blue-50 text-blue-900">
                    Real payment is temporarily disabled for testing. Booking will confirm instantly, and you can go straight to the video session flow.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Available balance</span>
                      <span className="font-semibold">{currency} {walletBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Session price</span>
                      <span className="font-semibold">{currency} {price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={`rounded-lg p-3 ${hasEnoughBalance ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
                      {hasEnoughBalance
                        ? 'You have enough balance. The session amount will be held when you book.'
                        : 'Your wallet balance is lower than the session price. Add money before booking.'}
                    </div>
                    {!hasEnoughBalance ? (
                      <Button variant="outline" asChild className="w-full">
                        <Link to={appRoutes.learnerWallet}>Add Money to Wallet</Link>
                      </Button>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Weekly Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(mentor.weeklySchedule || {}).length > 0 ? (
                  Object.entries(mentor.weeklySchedule || {}).map(([day, slots]) => (
                    <div key={day} className="flex items-start justify-between gap-4 border-b last:border-0 pb-2 last:pb-0">
                      <span className="font-medium capitalize">{day}</span>
                      <span className="text-muted-foreground text-right">{formatScheduleValue(slots)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No weekly schedule added yet. Message the mentor to confirm a suitable time.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LearnerLayout>
  );
};

export default BookSession;
