'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, LogOut, Users, CheckCircle, Clock, Copy, ExternalLink } from 'lucide-react';
import { CoachWithProgress, ONBOARDING_STEPS } from '@/types/database';

export default function AdminDashboard() {
  const [coaches, setCoaches] = useState<CoachWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const totalSteps = ONBOARDING_STEPS.length;

  const fetchCoaches = async () => {
    const { data: coachesData, error } = await supabase
      .from('coaches')
      .select(`
        *,
        onboarding_steps (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coaches:', error);
      return;
    }

    const coachesWithProgress: CoachWithProgress[] = (coachesData || []).map((coach) => {
      const steps = coach.onboarding_steps || [];
      const completedSteps = steps.filter((s: { completed: boolean }) => s.completed).length;
      return {
        ...coach,
        completed_steps: completedSteps,
        total_steps: totalSteps,
      };
    });

    setCoaches(coachesWithProgress);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const { error } = await supabase.from('coaches').insert({
      name: newCoachName,
      email: newCoachEmail,
    });

    if (error) {
      console.error('Error creating coach:', error);
      alert('Failed to create coach: ' + error.message);
    } else {
      setNewCoachName('');
      setNewCoachEmail('');
      setDialogOpen(false);
      fetchCoaches();
    }

    setCreating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const copyOnboardingLink = (token: string) => {
    const link = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="success">Complete</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const stats = {
    total: coaches.length,
    complete: coaches.filter((c) => c.status === 'complete').length,
    inProgress: coaches.filter((c) => c.status === 'in_progress').length,
    pending: coaches.filter((c) => c.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Boon Health Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Coaches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.complete}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.inProgress}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coaches Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Coaches</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coach
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Coach</DialogTitle>
                  <DialogDescription>
                    Create a new coach entry. A unique onboarding link will be generated automatically.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCoach}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCoachEmail}
                        onChange={(e) => setNewCoachEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Coach'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : coaches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No coaches yet. Add your first coach to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell className="font-medium">{coach.name}</TableCell>
                      <TableCell>{coach.email}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {coach.completed_steps}/{coach.total_steps} complete
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(coach.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(coach.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyOnboardingLink(coach.onboarding_token)}
                            title="Copy onboarding link"
                          >
                            {copiedToken === coach.onboarding_token ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/admin/coaches/${coach.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
