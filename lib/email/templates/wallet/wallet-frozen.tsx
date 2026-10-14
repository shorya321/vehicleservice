import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import SectionLabel from '../../components/section-label';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles, statusColors } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface WalletFrozenEmailProps {
  businessName: string;
  currentBalance: number;
  currency: string;
  freezeReason: string;
  frozenBy: string;
  freezeDate: string;
  supportUrl: string;
}

export const WalletFrozenEmail = ({
  businessName,
  currentBalance,
  currency,
  freezeReason,
  frozenBy,
  freezeDate,
  supportUrl,
}: WalletFrozenEmailProps) => {
  return (
    <EmailLayout
      preview="Your wallet has been frozen - Action required"
      heading="Wallet Frozen"
      eyebrow="Wallet frozen"
      tone="danger"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="error">
        <Text style={boxStyles.error.text}>
          <strong>Your wallet has been frozen!</strong>
          <br />
          You cannot use wallet funds until the freeze is lifted.
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        Your wallet has been temporarily frozen by our team. While your wallet is frozen, you will not
        be able to use wallet funds for bookings or transactions.
      </Text>

      <DetailsSection>
        <DetailRow label="Current Balance">{formatCurrency(currentBalance, currency)}</DetailRow>
        <DetailRow label="Status">
          <span style={{ color: statusColors.cancelled }}>Frozen</span>
        </DetailRow>
        <DetailRow label="Reason">{freezeReason}</DetailRow>
        <DetailRow label="Frozen By">{frozenBy}</DetailRow>
        <DetailRow label="Freeze Date">{freezeDate}</DetailRow>
      </DetailsSection>

      <SectionLabel>What this means:</SectionLabel>

      <ul style={emailStyles.list}>
        <li style={emailStyles.listItem}>
          You cannot use wallet funds for new bookings or transactions
        </li>
        <li style={emailStyles.listItem}>
          Your current balance remains secure and unchanged
        </li>
        <li style={emailStyles.listItem}>
          You can still add funds to your wallet
        </li>
        <li style={emailStyles.listItem}>
          All pending transactions will be affected
        </li>
      </ul>

      <SectionLabel>Next Steps:</SectionLabel>

      <Text style={emailStyles.text}>
        Please contact our support team to resolve the issue and have your wallet unfrozen. Our team
        is here to help and will work with you to address the situation.
      </Text>

      <Text style={emailStyles.text}>
        <a href={supportUrl} style={emailStyles.link}>
          Contact Support Team →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        When contacting support, please reference the freeze reason above to expedite the resolution
        process.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default WalletFrozenEmail;
