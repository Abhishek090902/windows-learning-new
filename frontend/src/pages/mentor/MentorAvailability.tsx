import { useEffect, useState } from 'react';
import { Clock, CalendarDays, Globe, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import MentorLayout from '@/components/MentorLayout';
import { useMyMentorProfile, useUpdateMentorAvailability } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MentorAvailability = () => {
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useMyMentorProfile();
  const updateAvailability = useUpdateMentorAvailability();
  const [acceptingSessions, setAcceptingSessions] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, { active: boolean; start: string; end: string }>>(
    Object.fromEntries(days.map(day => [day, { active: false, start: '09:00', end: '18:00' }]))
  );

  useEffect(() => {
    if (profile?.weeklySchedule) {
      const newSchedule = Object.fromEntries(days.map(day => [day, { active: false, start: '09:00', end: '18:00' }]));
      Object.entries(profile.weeklySchedule).forEach(([day, slots]: [string, any]) => {
        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
        const firstSlot = Array.isArray(slots) ? slots[0] : '';
        if (firstSlot && typeof firstSlot === 'string' && firstSlot.includes('-')) {
          const [start, end] = firstSlot.split('-');
          newSchedule[dayLabel] = { active: true, start, end };
        }
      });
      setSchedule(newSchedule);
    }
  }, [profile]);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
  };

  const handleSaveChanges = async () => {
    try {
      await updateAvailability.mutateAsync(schedule);
      toast({
        title: 'Availability Updated',
        description: 'Your schedule has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'There was an error updating your availability.',
        variant: 'destructive',
      });
    }
  };

  if (profileLoading) {
    return (
      <MentorLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-1">Availability</h1>
        <p className="text-muted-foreground mb-6">Manage your schedule and time off</p>

        {/* Status Toggle */}
        <Card className="mb-6">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="font-medium">Accepting New Sessions</p>
              <p className="text-sm text-muted-foreground">Toggle off to pause new bookings</p>
            </div>
            <Switch checked={acceptingSessions} onCheckedChange={setAcceptingSessions} />
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {days.map(day => (
                <div key={day} className="flex items-center gap-4 py-2">
                  <div className="w-28">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={schedule[day].active} onChange={() => toggleDay(day)} className="rounded border-border" />
                      <span className={`text-sm font-medium ${schedule[day].active ? '' : 'text-muted-foreground'}`}>{day}</span>
                    </label>
                  </div>
                  {schedule[day].active ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input type="time" aria-label="Start time" value={schedule[day].start} onChange={e => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))} className="h-9 px-3 rounded-lg border bg-background text-sm" />
                      <span className="text-muted-foreground">to</span>
                      <input type="time" aria-label="End time" value={schedule[day].end} onChange={e => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))} className="h-9 px-3 rounded-lg border bg-background text-sm" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSaveChanges} disabled={updateAvailability.isPending}>{updateAvailability.isPending ? 'Saving...' : 'Save Changes'}</Button>
          <Button variant="outline" disabled={updateAvailability.isPending}>Cancel</Button>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorAvailability;
