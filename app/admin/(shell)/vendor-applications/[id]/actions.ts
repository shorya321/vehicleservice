'use server';

import { createClient } from '@/lib/supabase/server';
import {
  sendVendorApplicationApprovedEmail,
  sendVendorApplicationRejectedEmail
} from '@/lib/email/services/vendor-emails';
import { getAppUrl } from '@/lib/email/config';

/**
 * Where an approval or rejection notice is addressed.
 *
 * business_email is nullable on rows created before it became required, and an empty
 * `to` fails the send after the RPC has already committed: the applicant is decided on
 * and never told. The account email is NOT NULL, so it is the address of last resort.
 */
async function resolveApplicantEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  application: { business_email: string | null; user_id: string | null }
): Promise<string> {
  if (application.business_email) {
    return application.business_email;
  }

  if (!application.user_id) {
    return '';
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', application.user_id)
    .single();

  return profile?.email || '';
}

interface ApproveApplicationData {
  applicationId: string;
  /**
   * The `updated_at` value the admin actually reviewed, passed straight through as
   * the raw string from Supabase. The RPC refuses to act if the applicant has edited
   * since. Never wrap this in `new Date()`. That truncates to milliseconds and every
   * comparison would fail.
   */
  expectedUpdatedAt: string;
  adminNotes?: string;
}

interface RejectApplicationData {
  applicationId: string;
  expectedUpdatedAt: string;
  rejectionReason: string;
  adminNotes?: string;
}

export async function approveVendorApplication(data: ApproveApplicationData) {
  try {
    const supabase = await createClient();

    // Get application details first
    const { data: application, error: fetchError } = await supabase
      .from('vendor_applications')
      .select('id, business_email, business_name, user_id')
      .eq('id', data.applicationId)
      .single();

    if (fetchError || !application) {
      return { error: 'Application not found' };
    }

    // Call RPC to approve application
    const { data: rpcData, error: rpcError } = await supabase.rpc('approve_vendor_application', {
      p_application_id: data.applicationId,
      p_expected_updated_at: data.expectedUpdatedAt,
      p_admin_notes: data.adminNotes,
    });

    if (rpcError) {
      console.error('RPC error approving application:', rpcError);
      return { error: rpcError.message || 'Failed to approve application' };
    }

    const approveResult = rpcData as Record<string, unknown> | null;
    if (approveResult?.error) {
      return { error: String(approveResult.error) };
    }

    // Send approval email
    const appUrl = getAppUrl();
    const loginUrl = `${appUrl}/login`;
    const dashboardUrl = `${appUrl}/vendor`;

    const applicantEmail = await resolveApplicantEmail(supabase, application);

    if (!applicantEmail) {
      console.error('No address on file for application', application.id);
      return { success: true, emailDelivered: false };
    }

    const emailResult = await sendVendorApplicationApprovedEmail({
      email: applicantEmail,
      name: application.business_name,
      applicationReference: application.id,
      loginUrl,
      dashboardUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error);
      // The decision stands either way; the caller is told so it can say so.
    }

    return { success: true, emailDelivered: emailResult.success, applicantEmail };
  } catch (error) {
    console.error('Error approving application:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function rejectVendorApplication(data: RejectApplicationData) {
  try {
    const supabase = await createClient();

    // Get application details first
    const { data: application, error: fetchError } = await supabase
      .from('vendor_applications')
      .select('id, business_email, business_name, user_id')
      .eq('id', data.applicationId)
      .single();

    if (fetchError || !application) {
      return { error: 'Application not found' };
    }

    // Call RPC to reject application
    const { data: rpcData, error: rpcError } = await supabase.rpc('reject_vendor_application', {
      p_application_id: data.applicationId,
      p_expected_updated_at: data.expectedUpdatedAt,
      p_rejection_reason: data.rejectionReason,
      p_admin_notes: data.adminNotes,
    });

    if (rpcError) {
      console.error('RPC error rejecting application:', rpcError);
      return { error: rpcError.message || 'Failed to reject application' };
    }

    const rejectResult = rpcData as Record<string, unknown> | null;
    if (rejectResult?.error) {
      return { error: String(rejectResult.error) };
    }

    // Send rejection email
    const appUrl = getAppUrl();
    const reapplyUrl = `${appUrl}/become-vendor`;

    const applicantEmail = await resolveApplicantEmail(supabase, application);

    if (!applicantEmail) {
      console.error('No address on file for application', application.id);
      return { success: true, emailDelivered: false };
    }

    const emailResult = await sendVendorApplicationRejectedEmail({
      email: applicantEmail,
      name: application.business_name,
      applicationReference: application.id,
      rejectionReason: data.rejectionReason,
      reapplyUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error);
      // The decision stands either way; the caller is told so it can say so.
    }

    return { success: true, emailDelivered: emailResult.success, applicantEmail };
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { error: 'An unexpected error occurred' };
  }
}
