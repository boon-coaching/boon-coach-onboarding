'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, CheckCircle, Download, Upload, User, Mail, Calendar, ExternalLink, AlertCircle, MessageSquare, DollarSign, Pencil } from 'lucide-react';
import { Coach, CoachProfile, OnboardingStep, ONBOARDING_STEPS, ReviewStatus } from '@/types/database';
import { sendEmail } from '@/lib/email-client';

export default function CoachDetailPage() {
  const params = useParams();
  const coachId = params.id as string;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; stepKey: string; currentFeedback: string }>({
    open: false,
    stepKey: '',
    currentFeedback: '',
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateValue, setRateValue] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const supabase = createClient();

  const fetchCoachData = async () => {
    const { data: coachData } = await supabase
      .from('coach_onboarding')
      .select('*')
      .eq('id', coachId)
      .single();

    const { data: profileData } = await supabase
      .from('coach_onboarding_profiles')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    const { data: stepsData } = await supabase
      .from('coach_onboarding_steps')
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
    const previousStatus = coach?.status;

    const { error } = await supabase
      .from('coach_onboarding_steps')
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

    // Refetch to get updated status (DB trigger may have set it to 'complete')
    const { data: updatedCoach } = await supabase
      .from('coach_onboarding')
      .select('*')
      .eq('id', coachId)
      .single();

    if (updatedCoach && updatedCoach.status === 'complete' && previousStatus !== 'complete') {
      sendEmail({
        type: 'all-steps-complete',
        data: {
          coachId,
          coachName: updatedCoach.name,
          coachEmail: updatedCoach.email,
        },
      });
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

  const saveRate = async () => {
    setSavingRate(true);
    const { error } = await supabase
      .from('coach_onboarding')
      .update({ hourly_rate: rateValue ? parseFloat(rateValue) : null })
      .eq('id', coachId);

    if (error) {
      console.error('Error updating rate:', error);
      alert('Failed to update rate');
    } else {
      setEditingRate(false);
      fetchCoachData();
    }
    setSavingRate(false);
  };

  const handleAdminContractUpload = async (file: File) => {
    if (!coach) return;
    setUploadingContract(true);

    const folderName = coach.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const fileExt = file.name.split('.').pop();
    const fileName = `${folderName}/1099-contract-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload contract: ' + uploadError.message);
      setUploadingContract(false);
      return;
    }

    const { error: stepError } = await supabase
      .from('coach_onboarding_steps')
      .update({ admin_file_path: fileName })
      .eq('coach_id', coachId)
      .eq('step_key', '1099');

    if (stepError) {
      console.error('Step update error:', stepError);
      alert('Failed to save contract path');
    }

    setUploadingContract(false);
    fetchCoachData();
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

  const openFeedbackDialog = (stepKey: string, currentFeedback: string | null) => {
    setFeedbackText(currentFeedback || '');
    setFeedbackDialog({ open: true, stepKey, currentFeedback: currentFeedback || '' });
  };

  const updateReviewStatus = async (stepKey: string, status: ReviewStatus, feedback?: string) => {
    setSavingReview(true);

    const updateData: { review_status: ReviewStatus; reviewed_at: string; review_feedback?: string | null; completed?: boolean; completed_at?: string | null } = {
      review_status: status,
      reviewed_at: new Date().toISOString(),
    };

    if (feedback !== undefined) {
      updateData.review_feedback = feedback || null;
    }

    if (status === 'changes_requested') {
      updateData.completed = false;
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from('coach_onboarding_steps')
      .update(updateData)
      .eq('coach_id', coachId)
      .eq('step_key', stepKey);

    if (error) {
      console.error('Error updating review status:', error);
      alert('Failed to update review status');
    } else {
      const stepDef = ONBOARDING_STEPS.find((s) => s.key === stepKey);
      if (coach && stepDef) {
        if (status === 'approved') {
          sendEmail({
            type: 'step-approved',
            data: {
              coachName: coach.name,
              coachEmail: coach.email,
              stepLabel: stepDef.label,
              token: coach.onboarding_token,
            },
          });
        } else if (status === 'changes_requested' && feedback) {
          sendEmail({
            type: 'changes-requested',
            data: {
              coachName: coach.name,
              coachEmail: coach.email,
              stepLabel: stepDef.label,
              feedback,
              token: coach.onboarding_token,
            },
          });
        }
      }
      setFeedbackDialog({ open: false, stepKey: '', currentFeedback: '' });
      fetchCoachData();
    }

    setSavingReview(false);
  };

  const approveStep = async (stepKey: string) => {
    await updateReviewStatus(stepKey, 'approved');
  };

  const requestChanges = async () => {
    if (!feedbackText.trim()) {
      alert('Please provide feedback explaining what changes are needed');
      return;
    }
    await updateReviewStatus(feedbackDialog.stepKey, 'changes_requested', feedbackText);
  };

  const getReviewBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'changes_requested':
        return <Badge variant="destructive">Changes Requested</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-muted-foreground">Coach Details</h1>
          </div>
          <img
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            className="h-7"
          />
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
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {editingRate ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rateValue}
                            onChange={(e) => setRateValue(e.target.value)}
                            className="h-7 w-28 pl-5 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <Button size="sm" variant="default" className="h-7 text-xs" onClick={saveRate} disabled={savingRate}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingRate(false)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{coach.hourly_rate ? `$${coach.hourly_rate}/hr` : 'No rate set'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setRateValue(coach.hourly_rate?.toString() || '');
                            setEditingRate(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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
              Review submitted items and request changes if needed. Toggle manual steps when complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ONBOARDING_STEPS.map((step) => {
                const stepStatus = getStepStatus(step.key);
                const isManual = manualSteps.includes(step.key);
                const hasFile = stepStatus?.file_path;
                const isContract = step.type === 'contract';
                const isReviewable = step.type === 'upload' || step.type === 'form' || step.type === 'contract';
                const reviewStatus = stepStatus?.review_status || 'pending';

                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      reviewStatus === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : reviewStatus === 'changes_requested'
                        ? 'bg-red-50 border-red-200'
                        : stepStatus?.completed
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-background'
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
                            reviewStatus === 'approved'
                              ? 'bg-green-500 text-white'
                              : reviewStatus === 'changes_requested'
                              ? 'bg-red-500 text-white'
                              : stepStatus?.completed
                              ? 'bg-yellow-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {reviewStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                          {reviewStatus === 'changes_requested' && <AlertCircle className="h-3 w-3" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-medium">{step.label}</h4>
                        <div className="flex items-center gap-2">
                          {isReviewable && stepStatus?.completed && getReviewBadge(reviewStatus)}
                          {stepStatus?.completed && stepStatus.completed_at && (
                            <span className="text-xs text-muted-foreground">
                              Submitted {new Date(stepStatus.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>

                      {/* Feedback display */}
                      {stepStatus?.review_feedback && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-red-800">Feedback: </span>
                              <span className="text-red-700">{stepStatus.review_feedback}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Contract step: admin upload + download buttons */}
                        {isContract && (
                          <>
                            {!stepStatus?.admin_file_path ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Upload the 1099 agreement for this coach to review and sign.</p>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={uploadingContract}
                                    asChild
                                  >
                                    <span>
                                      <Upload className="h-3 w-3 mr-1" />
                                      {uploadingContract ? 'Uploading...' : 'Upload Contract'}
                                    </span>
                                  </Button>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleAdminContractUpload(file);
                                    }}
                                    disabled={uploadingContract}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadFile(stepStatus!.admin_file_path!, `${coach.name}-1099-contract`)
                                }
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Original Contract
                              </Button>
                            )}
                            {hasFile && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadFile(stepStatus!.file_path!, `${coach.name}-1099-signed`)
                                }
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Signed Version
                              </Button>
                            )}
                          </>
                        )}

                        {/* Regular file download for non-contract steps */}
                        {!isContract && hasFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadFile(stepStatus.file_path!, `${coach.name}-${step.key}`)
                            }
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}

                        {/* Review actions for reviewable steps */}
                        {isReviewable && stepStatus?.completed && reviewStatus !== 'approved' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveStep(step.key)}
                              disabled={savingReview}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openFeedbackDialog(step.key, stepStatus.review_feedback)}
                              disabled={savingReview}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Request Changes
                            </Button>
                          </>
                        )}

                        {isManual && (
                          <Badge variant="outline">
                            Admin Task
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Changes</DialogTitle>
              <DialogDescription>
                Provide feedback explaining what changes are needed. The coach will see this message and be able to re-submit.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="e.g., The W9 form is blurry and unreadable. Please upload a clearer scan."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialog({ open: false, stepKey: '', currentFeedback: '' })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={requestChanges} disabled={savingReview || !feedbackText.trim()}>
                {savingReview ? 'Saving...' : 'Request Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
