import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingReference: string;
  vehicleCategory: string;
  vehicleType?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  totalAmount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  passengerCount?: number;
  basePrice?: number;
  amenitiesPrice?: number;
  extras?: Array<{ label: string; quantity: number; price: number }>;
  customerNotes?: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingReference,
  vehicleCategory,
  vehicleType,
  passengerCapacity,
  luggageCapacity,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  totalAmount,
  currency,
  originalAmount,
  originalCurrency,
  passengerCount,
  basePrice,
  amenitiesPrice: _amenitiesPrice,
  extras,
  customerNotes,
}: BookingConfirmationEmailProps) => {
  const hasBookingSummary = passengerCount != null && basePrice != null;
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  return (
    <EmailLayout
      preview={`Booking Confirmed - ${bookingReference}`}
      heading="Booking Confirmation"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        Great news! Your booking has been confirmed. Here are your booking details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle Category:</strong> {vehicleCategory}
        </Text>
        {vehicleType && (
          <Text style={emailStyles.detailRow}>
            <strong>Vehicle Type:</strong> {vehicleType}
          </Text>
        )}
        {(passengerCapacity || luggageCapacity) && (
          <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
            {passengerCapacity ? `Up to ${passengerCapacity} passengers` : ''}
            {passengerCapacity && luggageCapacity ? ' · ' : ''}
            {luggageCapacity ? `Up to ${luggageCapacity} luggage` : ''}
          </Text>
        )}
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date & Time:</strong> {pickupDate} at {pickupTime}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Location:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Date & Time:</strong> {dropoffDate} at {dropoffTime}
        </Text>
        {hasBookingSummary && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={{ ...emailStyles.detailRow, fontWeight: 'bold', fontSize: '16px' }}>
              Booking Summary
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', fontSize: '14px', color: '#333333' }}>
                    Base Fare ({passengerCount} Passenger{passengerCount !== 1 ? 's' : ''})
                  </td>
                  <td style={{ padding: '4px 0', fontSize: '14px', color: '#333333', textAlign: 'right' as const }}>
                    {currency} {basePrice.toFixed(2)}
                  </td>
                </tr>
                {extras && extras.length > 0 && extras.map((extra, index) => (
                  <tr key={index}>
                    <td style={{ padding: '4px 0', fontSize: '14px', color: '#333333' }}>
                      {extra.label}{extra.quantity > 1 ? ` x${extra.quantity}` : ''}
                    </td>
                    <td style={{ padding: '4px 0', fontSize: '14px', color: '#333333', textAlign: 'right' as const }}>
                      {currency} {extra.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding: '8px 0 0' }}>
                    <Hr style={{ ...emailStyles.hr, margin: '0' }} />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', fontSize: '15px', fontWeight: 'bold', color: '#333333' }}>
                    Total Amount
                  </td>
                  <td style={{ padding: '4px 0', fontSize: '15px', fontWeight: 'bold', color: '#333333', textAlign: 'right' as const }}>
                    {currency} {totalAmount.toFixed(2)}
                  </td>
                </tr>
                {showChargeNote && (
                  <tr>
                    <td colSpan={2} style={{ padding: '2px 0', fontSize: '13px', color: '#666666', textAlign: 'right' as const }}>
                      Payment charged in {originalCurrency} {originalAmount!.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {!hasBookingSummary && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.totalRow}>
              <strong>Total Amount:</strong> {currency} {totalAmount.toFixed(2)}
            </Text>
            {showChargeNote && (
              <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
                Payment charged in {originalCurrency} {originalAmount!.toFixed(2)}
              </Text>
            )}
          </>
        )}

        {customerNotes && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Special Requests:</strong> {customerNotes}
            </Text>
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        We&apos;ll send you updates about your booking, including vendor assignment and any changes to
        your reservation.
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions or need to modify your booking, please contact our support team
        and provide your booking reference number.
      </Text>

      <Text style={emailStyles.text}>
        Thank you for choosing Infinia Transfers!
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingConfirmationEmail;
