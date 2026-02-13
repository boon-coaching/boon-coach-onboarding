import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';
import { CoachInviteEmail } from '@emails/coach-invite';
import { ChangesRequestedEmail } from '@emails/changes-requested';
import { StepApprovedEmail } from '@emails/step-approved';
import { AllStepsCompleteEmail } from '@emails/all-steps-complete';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();
    const resend = getResend();
    const emailFrom = process.env.EMAIL_FROM || 'Boon <jfuentes@boon-health.com>';
    const adminEmail = process.env.ADMIN_EMAIL || 'hello@boon-health.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const firstName = data.coachName?.split(' ')[0] || data.coachName;

    switch (type) {
      case 'coach-invite': {
        const onboardingUrl = `${appUrl}/onboard/${data.token}`;
        await resend.emails.send({
          from: emailFrom,
          to: data.coachEmail,
          subject: `Welcome to Boon - Start Your Onboarding`,
          react: CoachInviteEmail({
            coachName: firstName,
            onboardingUrl,
          }),
        });
        break;
      }

      case 'changes-requested': {
        const onboardingUrl = `${appUrl}/onboard/${data.token}`;
        await resend.emails.send({
          from: emailFrom,
          to: data.coachEmail,
          subject: `Changes Requested: ${data.stepLabel}`,
          react: ChangesRequestedEmail({
            coachName: firstName,
            stepLabel: data.stepLabel,
            feedback: data.feedback,
            onboardingUrl,
          }),
        });
        break;
      }

      case 'step-approved': {
        const onboardingUrl = `${appUrl}/onboard/${data.token}`;
        await resend.emails.send({
          from: emailFrom,
          to: data.coachEmail,
          subject: `Approved: ${data.stepLabel}`,
          react: StepApprovedEmail({
            coachName: firstName,
            stepLabel: data.stepLabel,
            onboardingUrl,
          }),
        });
        break;
      }

      case 'all-steps-complete': {
        const adminUrl = `${appUrl}/admin/coaches/${data.coachId}`;
        await resend.emails.send({
          from: emailFrom,
          to: adminEmail,
          subject: `Onboarding Complete: ${data.coachName}`,
          react: AllStepsCompleteEmail({
            coachName: data.coachName,
            coachEmail: data.coachEmail,
            adminUrl,
          }),
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
