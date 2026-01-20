'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Upload,
  FileText,
  User,
  Image as ImageIcon,
  Award,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Coach,
  CoachProfile,
  OnboardingStep,
  ONBOARDING_STEPS,
  COACHING_SPECIALTIES,
  OnboardingStepKey,
  ReviewStatus,
} from '@/types/database';

export default function CoachOnboardingPortal() {
  const params = useParams();
  const token = params.token as string;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [credentials, setCredentials] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [schedulingPreferences, setSchedulingPreferences] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCoachData = useCallback(async () => {
    const { data: coachData, error: coachError } = await supabase
      .from('coach_onboarding')
      .select('*')
      .eq('onboarding_token', token)
      .single();

    if (coachError || !coachData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setCoach(coachData);

    const [stepsRes, profileRes] = await Promise.all([
      supabase.from('coach_onboarding_steps').select('*').eq('coach_id', coachData.id),
      supabase.from('coach_onboarding_profiles').select('*').eq('coach_id', coachData.id).single(),
    ]);

    if (stepsRes.data) setSteps(stepsRes.data);
    if (profileRes.data) {
      setProfile(profileRes.data);
      setBio(profileRes.data.bio || '');
      setSpecialties(profileRes.data.specialties || []);
      setCredentials(profileRes.data.credentials || '');
      setLinkedinUrl(profileRes.data.linkedin_url || '');
      setSchedulingPreferences(profileRes.data.scheduling_preferences || '');
    }

    setLoading(false);
  }, [token, supabase]);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);

  const handleFileUpload = async (stepKey: OnboardingStepKey, file: File) => {
    if (!coach) return;

    setUploading(stepKey);

    const fileExt = file.name.split('.').pop();
    const fileName = `${coach.id}/${stepKey}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload file: ' + uploadError.message);
      setUploading(null);
      return;
    }

    const { error: stepError } = await supabase
      .from('coach_onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        file_path: fileName,
        review_status: 'pending',
        review_feedback: null,
        reviewed_at: null,
      })
      .eq('coach_id', coach.id)
      .eq('step_key', stepKey);

    if (stepError) {
      console.error('Step update error:', stepError);
      alert('Failed to update step');
    }

    setUploading(null);
    fetchCoachData();
  };

  const handleDeckReviewed = async (checked: boolean) => {
    if (!coach) return;

    const { error } = await supabase
      .from('coach_onboarding_steps')
      .update({
        completed: checked,
        completed_at: checked ? new Date().toISOString() : null,
      })
      .eq('coach_id', coach.id)
      .eq('step_key', 'deck_reviewed');

    if (error) {
      console.error('Error updating deck reviewed:', error);
      return;
    }

    fetchCoachData();
  };

  const saveProfile = async () => {
    if (!coach) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from('coach_onboarding_profiles')
      .update({
        bio,
        specialties,
        credentials,
        linkedin_url: linkedinUrl,
        scheduling_preferences: schedulingPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('coach_id', coach.id);

    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
      setSavingProfile(false);
      return;
    }

    if (bio && specialties.length > 0) {
      await supabase
        .from('coach_onboarding_steps')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          review_status: 'pending',
          review_feedback: null,
          reviewed_at: null,
        })
        .eq('coach_id', coach.id)
        .eq('step_key', 'profile');
    }

    setSavingProfile(false);
    fetchCoachData();
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const getStepStatus = (stepKey: string) => {
    return steps.find((s) => s.step_key === stepKey);
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / ONBOARDING_STEPS.length) * 100;

  const getStepIcon = (stepKey: string) => {
    switch (stepKey) {
      case 'w9':
      case '1099':
        return <FileText className="h-5 w-5" />;
      case 'headshot':
        return <ImageIcon className="h-5 w-5" />;
      case 'certifications':
        return <Award className="h-5 w-5" />;
      case 'profile':
        return <User className="h-5 w-5" />;
      case 'deck_reviewed':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !coach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Link Not Found</CardTitle>
            <CardDescription>
              This onboarding link is invalid or has expired. Please contact your administrator
              for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const uploadSteps = ONBOARDING_STEPS.filter((s) => s.type === 'upload');
  const deckStep = ONBOARDING_STEPS.find((s) => s.key === 'deck_reviewed');
  const manualSteps = ONBOARDING_STEPS.filter((s) => s.type === 'manual');

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img
              src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
              alt="Boon"
              className="h-8"
            />
            <Badge variant="outline">{coach.email}</Badge>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Onboarding Progress</span>
              <span className="font-medium">
                {completedCount}/{ONBOARDING_STEPS.length} complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        {/* Welcome */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {coach.name}!</CardTitle>
            <CardDescription>
              Complete the steps below to finish your onboarding with Boon. Your progress is
              saved automatically, so you can return anytime.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Document Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Uploads
            </CardTitle>
            <CardDescription>
              Upload the required documents. Accepted formats: PDF for forms, JPG/PNG for photos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadSteps.map((step) => {
              const stepStatus = getStepStatus(step.key);
              const isUploading = uploading === step.key;
              const isOptional = step.key === 'certifications';
              const reviewStatus = stepStatus?.review_status || 'pending';
              const needsResubmit = reviewStatus === 'changes_requested';
              const isApproved = reviewStatus === 'approved';

              return (
                <div
                  key={step.key}
                  className={`p-4 rounded-lg border ${
                    isApproved
                      ? 'bg-green-50 border-green-200'
                      : needsResubmit
                      ? 'bg-red-50 border-red-200'
                      : stepStatus?.completed
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        isApproved
                          ? 'bg-green-500 text-white'
                          : needsResubmit
                          ? 'bg-red-500 text-white'
                          : stepStatus?.completed
                          ? 'bg-yellow-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {getStepIcon(step.key)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{step.label}</h4>
                        {isOptional && (
                          <Badge variant="secondary" className="text-xs">
                            Optional
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge variant="success" className="text-xs">
                            Approved
                          </Badge>
                        )}
                        {needsResubmit && (
                          <Badge variant="destructive" className="text-xs">
                            Changes Requested
                          </Badge>
                        )}
                        {stepStatus?.completed && !isApproved && !needsResubmit && (
                          <Badge variant="warning" className="text-xs">
                            Pending Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>

                      {/* Feedback from admin */}
                      {stepStatus?.review_feedback && (
                        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-red-800 text-sm">Feedback from admin:</span>
                              <p className="text-red-700 text-sm mt-1">{stepStatus.review_feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        {isApproved ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Approved
                          </div>
                        ) : stepStatus?.completed && !needsResubmit ? (
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <CheckCircle className="h-4 w-4" />
                            Uploaded - awaiting review
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept={step.key === 'headshot' ? 'image/*' : '.pdf'}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(step.key, file);
                              }}
                              disabled={isUploading}
                              className="max-w-xs"
                            />
                            {isUploading && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Coach Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Coach Profile
            </CardTitle>
            <CardDescription>
              Tell us about yourself. This information will be used for your coach profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your coaching background and approach..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Coaching Specialties *</Label>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {COACHING_SPECIALTIES.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={specialties.includes(specialty) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                    {specialties.includes(specialty) && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentials">Credentials & Certifications</Label>
              <Input
                id="credentials"
                placeholder="e.g., ICF PCC, MBA, Licensed Therapist"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduling">Scheduling Preferences / Availability Notes</Label>
              <Textarea
                id="scheduling"
                placeholder="e.g., Available Mon-Fri 9am-5pm EST, prefer 30-min sessions"
                value={schedulingPreferences}
                onChange={(e) => setSchedulingPreferences(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>

            {(() => {
              const profileStep = getStepStatus('profile');
              const reviewStatus = profileStep?.review_status || 'pending';

              if (profileStep?.review_feedback) {
                return (
                  <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800 text-sm">Feedback from admin:</span>
                        <p className="text-red-700 text-sm mt-1">{profileStep.review_feedback}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (reviewStatus === 'approved') {
                return (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Profile approved
                  </div>
                );
              }

              if (profileStep?.completed) {
                return (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <CheckCircle className="h-4 w-4" />
                    Profile saved - awaiting review
                  </div>
                );
              }

              return null;
            })()}
          </CardContent>
        </Card>

        {/* Deck Review */}
        {deckStep && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {deckStep.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Checkbox
                  id="deck-reviewed"
                  checked={getStepStatus('deck_reviewed')?.completed || false}
                  onCheckedChange={(checked) => handleDeckReviewed(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="deck-reviewed" className="cursor-pointer">
                    {deckStep.description}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    The onboarding deck has been sent to your email. Please review it before
                    checking this box.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Setup (We&apos;ll Handle These)</CardTitle>
            <CardDescription>
              These steps will be completed by our team. We&apos;ll update you when each is done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {manualSteps.map((step) => {
              const stepStatus = getStepStatus(step.key);
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    stepStatus?.completed ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      stepStatus?.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepStatus?.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">?</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{step.label}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {stepStatus?.completed && (
                    <Badge variant="success" className="ml-auto">
                      Complete
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Completion message */}
        {progressPercent === 100 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-green-800">Onboarding Complete!</CardTitle>
              <CardDescription className="text-green-700">
                You&apos;ve completed all onboarding steps. Welcome to the Boon team!
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Need help? Contact{' '}
          <a href="mailto:support@boon.com" className="text-primary hover:underline">
            support@boon.com
          </a>
        </div>
      </footer>
    </div>
  );
}
