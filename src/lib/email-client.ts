interface SendEmailParams {
  type: 'coach-invite' | 'changes-requested' | 'step-approved' | 'all-steps-complete';
  data: Record<string, string>;
}

export function sendEmail({ type, data }: SendEmailParams) {
  fetch('/api/emails/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  }).catch(console.error);
}
