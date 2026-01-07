'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, CheckCircle, Download, User, Mail, Calendar, ExternalLink } from 'lucide-react';
import { Coach, CoachProfile, OnboardingStep, ONBOARDING_STEPS } from '@/types/database';

export default function CoachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id as string;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const supabase = createClient();

  const fetchCoachData = async () => {
    const { data: coachData } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    const { data: stepsData } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('coach_id', coachId);

    if (coachData) setCoach(coachData as Coach);
    if (profileData) setProfile(profileData as CoachProfile);
    if (stepsData) setSteps(stepsData as OnboardingStep[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoachData();
  }, [coachId]);

  const toggleStep = async (stepKey: string, currentCompleted: boolean) => {
    const { error } = await supabase
      .from('onboarding_steps')
      .update({
        completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toISOString() : null,
      })
      .eq('coach_id', coachId)
      .eq('step_key', stepKey);

    if (error) {
      console.error('Error updating step:', error);
      return;
    }

    fetchCoachData();
  };

  const copyOnboardingLink = () => {
    if (!coach) return;
    const link = `${window.location.origin}/onboard/${coach.onboarding_token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('coach-documents')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepStatus = (stepKey: string) => {
    return steps.find((s) => s.step_key === stepKey);
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / ONBOARDING_STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Coach not found</h2>
          <Link href="/admin">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const manualSteps = ['zoom', 'gmail', 'salesforce'];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary">Coach Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Coach Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{coach.name}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {coach.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Added {new Date(coach.created_at).toLocaleDateString()}
                  </div>
                </CardDescription>
              </div>
              <Badge
                variant={
                  coach.status === 'complete'
                    ? 'success'
                    : coach.status === 'in_progress'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {coach.status === 'complete'
                  ? 'Complete'
                  : coach.status === 'in_progress'
                  ? 'In Progress'
                  : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Onboarding Progress</span>
                  <span className="font-medium">
                    {completedCount}/{ONBOARDING_STEPS.length} steps
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyOnboardingLink}>
                  {copiedLink ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copiedLink ? 'Copied!' : 'Copy Onboarding Link'}
                </Button>
                <Link href={`/onboard/${coach.onboarding_token}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Portal
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Profile */}
        {profile && (profile.bio || profile.specialties?.length || profile.credentials) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Coach Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.bio && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Bio</h4>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
              {profile.specialties && profile.specialties.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.credentials && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Credentials</h4>
                  <p className="text-sm">{profile.credentials}</p>
                </div>
              )}
              {profile.linkedin_url && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">LinkedIn</h4>
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {profile.linkedin_url}
                  </a>
                </div>
              )}
              {profile.scheduling_preferences && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Scheduling Preferences
                  </h4>
                  <p className="text-sm">{profile.scheduling_preferences}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Onboarding Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Steps</CardTitle>
            <CardDescription>
              Toggle manual steps (Zoom, Gmail, Salesforce) when complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ONBOARDING_STEPS.map((step) => {
                const stepStatus = getStepStatus(step.key);
                const isManual = manualSteps.includes(step.key);
                const hasFile = stepStatus?.file_path;

                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      stepStatus?.completed ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isManual ? (
                        <Checkbox
                          checked={stepStatus?.completed || false}
                          onCheckedChange={() =>
                            toggleStep(step.key, stepStatus?.completed || false)
                          }
                        />
                      ) : (
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${
                            stepStatus?.completed
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {stepStatus?.completed && <CheckCircle className="h-3 w-3" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.label}</h4>
                        {stepStatus?.completed && stepStatus.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            Completed {new Date(stepStatus.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {hasFile && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-2"
                          onClick={() =>
                            downloadFile(stepStatus.file_path!, `${coach.name}-${step.key}`)
                          }
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download File
                        </Button>
                      )}
                      {isManual && (
                        <Badge variant="outline" className="mt-2">
                          Admin Task
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
