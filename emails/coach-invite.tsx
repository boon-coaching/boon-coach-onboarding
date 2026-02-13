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
  onboardingUrl: string;
}

export function CoachInviteEmail({ coachName, onboardingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Boon - Start your onboarding</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            width="120"
            height="auto"
            style={logo}
          />
          <Heading style={heading}>Welcome to Boon, {coachName}!</Heading>
          <Text style={paragraph}>
            We are excited to have you join our coaching team. To get started, please complete
            your onboarding by clicking the link below.
          </Text>
          <Text style={paragraph}>Here is what you will need to have ready:</Text>
          <ul style={list}>
            <li style={listItem}>W9 form (PDF)</li>
            <li style={listItem}>Review and sign your 1099 contractor agreement</li>
            <li style={listItem}>Professional headshot (JPG/PNG)</li>
            <li style={listItem}>Coaching certifications, if applicable (PDF)</li>
            <li style={listItem}>Bio and coaching specialties</li>
          </ul>
          <Section style={buttonSection}>
            <Button style={button} href={onboardingUrl}>
              Start Onboarding
            </Button>
          </Section>
          <Text style={paragraph}>
            Your progress is saved automatically, so you can return to your onboarding portal
            at any time using the same link.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Boon Leadership Development</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CoachInviteEmail;

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

const list = {
  paddingLeft: '20px',
  marginBottom: '24px',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '28px',
  color: '#334155',
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
