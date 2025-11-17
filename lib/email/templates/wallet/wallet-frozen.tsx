import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
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
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox variant="error">
        <Text style={emailStyles.text}>
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
        <Text style={emailStyles.detailRow}>
          <strong>Current Balance:</strong> {formatCurrency(currentBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{...emailStyles.detailRow, color: '#ef4444'}}>
          <strong>Status:</strong> Frozen
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Reason:</strong> {freezeReason}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Frozen By:</strong> {frozenBy}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Freeze Date:</strong> {freezeDate}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>What this means:</strong>
      </Text>

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

      <Text style={emailStyles.text}>
        <strong>Next Steps:</strong>
      </Text>

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
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default WalletFrozenEmail;
