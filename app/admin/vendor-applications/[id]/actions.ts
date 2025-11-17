'use server';

import { createClient } from '@/lib/supabase/server';
import {
  sendVendorApplicationApprovedEmail,
  sendVendorApplicationRejectedEmail
} from '@/lib/email/services/vendor-emails';
import { getAppUrl } from '@/lib/email/config';

interface ApproveApplicationData {
  applicationId: string;
  adminNotes?: string;
}

interface RejectApplicationData {
  applicationId: string;
  rejectionReason: string;
  adminNotes?: string;
}

export async function approveVendorApplication(data: ApproveApplicationData) {
  try {
    const supabase = await createClient();

    // Get application details first
    const { data: application, error: fetchError } = await supabase
      .from('vendor_applications')
      .select('id, email, applicant_name, application_reference')
      .eq('id', data.applicationId)
      .single();

    if (fetchError || !application) {
      return { error: 'Application not found' };
    }

    // Call RPC to approve application
    const { data: rpcData, error: rpcError } = await supabase.rpc('approve_vendor_application', {
      p_application_id: data.applicationId,
      p_admin_notes: data.adminNotes || null,
    });

    if (rpcError) {
      console.error('RPC error approving application:', rpcError);
      return { error: rpcError.message || 'Failed to approve application' };
    }

    if (rpcData?.error) {
      return { error: rpcData.error };
    }

    // Send approval email
    const appUrl = getAppUrl();
    const loginUrl = `${appUrl}/vendor/login`;
    const dashboardUrl = `${appUrl}/vendor`;

    const emailResult = await sendVendorApplicationApprovedEmail({
      email: application.email,
      name: application.applicant_name,
      applicationReference: application.application_reference,
      loginUrl,
      dashboardUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error);
      // Don't fail the approval if email fails
    }

    return { success: true };
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
      .select('id, email, applicant_name, application_reference')
      .eq('id', data.applicationId)
      .single();

    if (fetchError || !application) {
      return { error: 'Application not found' };
    }

    // Call RPC to reject application
    const { data: rpcData, error: rpcError } = await supabase.rpc('reject_vendor_application', {
      p_application_id: data.applicationId,
      p_rejection_reason: data.rejectionReason,
      p_admin_notes: data.adminNotes || null,
    });

    if (rpcError) {
      console.error('RPC error rejecting application:', rpcError);
      return { error: rpcError.message || 'Failed to reject application' };
    }

    if (rpcData?.error) {
      return { error: rpcData.error };
    }

    // Send rejection email
    const appUrl = getAppUrl();
    const reapplyUrl = `${appUrl}/customer/apply-vendor`;

    const emailResult = await sendVendorApplicationRejectedEmail({
      email: application.email,
      name: application.applicant_name,
      applicationReference: application.application_reference,
      rejectionReason: data.rejectionReason,
      reapplyUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error);
      // Don't fail the rejection if email fails
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { error: 'An unexpected error occurred' };
  }
}
