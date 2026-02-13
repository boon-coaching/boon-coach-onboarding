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
  coachEmail: string;
  adminUrl: string;
}

export function AllStepsCompleteEmail({ coachName, coachEmail, adminUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{coachName} has completed all onboarding steps</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            width="120"
            height="auto"
            style={logo}
          />
          <Heading style={heading}>Onboarding Complete</Heading>
          <Section style={successBox}>
            <Text style={successText}>
              <strong>{coachName}</strong> ({coachEmail}) has completed all 9 onboarding steps.
            </Text>
          </Section>
          <Text style={paragraph}>
            All documents have been submitted and the coach profile is ready for review.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={adminUrl}>
              Review Coach Profile
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Boon Leadership Development</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AllStepsCompleteEmail;

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

const successBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
};

const successText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#166534',
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
