import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Props {
  coachName: string;
  stepLabel: string;
  feedback: string;
  onboardingUrl: string;
}

export function ChangesRequestedEmail({ coachName, stepLabel, feedback, onboardingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Changes requested for {stepLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            width="120"
            height="36"
            style={logo}
          />
          <Heading style={heading}>Changes Requested</Heading>
          <Text style={paragraph}>
            Hi {coachName}, the admin team has reviewed your <strong>{stepLabel}</strong> submission
            and has requested some changes.
          </Text>
          <Section style={feedbackBox}>
            <Text style={feedbackLabel}>Feedback:</Text>
            <Text style={feedbackText}>{feedback}</Text>
          </Section>
          <Text style={paragraph}>
            Please update your submission at your earliest convenience.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={onboardingUrl}>
              Update Submission
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Boon Leadership Development</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ChangesRequestedEmail;

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const logo = {
  marginBottom: '24px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#0f172a',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#334155',
};

const feedbackBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
};

const feedbackLabel = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#991b1b',
  marginBottom: '4px',
};

const feedbackText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#7f1d1d',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const footer = {
  fontSize: '12px',
  color: '#94a3b8',
};
