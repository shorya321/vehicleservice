'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  emailTemplates,
  getTemplateById,
  getTemplatePreviewData,
  type EmailTemplateType,
} from '@/lib/email/utils/preview-data';
import { render } from '@react-email/render';
import { Mail, Monitor, Smartphone } from 'lucide-react';
import { sendTestEmail } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import email templates
import WelcomeEmail from '@/lib/email/templates/auth/welcome';
import VerificationEmail from '@/lib/email/templates/auth/verification';
import PasswordResetEmail from '@/lib/email/templates/auth/password-reset';
import BookingConfirmationEmail from '@/lib/email/templates/booking/confirmation';
import BookingStatusUpdateEmail from '@/lib/email/templates/booking/status-update';
import VendorApplicationReceivedEmail from '@/lib/email/templates/vendor/application-received';
import VendorApplicationApprovedEmail from '@/lib/email/templates/vendor/application-approved';
import VendorApplicationRejectedEmail from '@/lib/email/templates/vendor/application-rejected';

const templateComponents: Record<EmailTemplateType, any> = {
  welcome: WelcomeEmail,
  verification: VerificationEmail,
  passwordReset: PasswordResetEmail,
  bookingConfirmation: BookingConfirmationEmail,
  bookingStatus: BookingStatusUpdateEmail,
  vendorReceived: VendorApplicationReceivedEmail,
  vendorApproved: VendorApplicationApprovedEmail,
  vendorRejected: VendorApplicationRejectedEmail,
};

type PreviewMode = 'desktop' | 'mobile';

export function EmailManagementClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>('welcome');
  const [emailHtml, setEmailHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Group templates by category
  const authTemplates = emailTemplates.filter((t) => t.category === 'auth');
  const bookingTemplates = emailTemplates.filter((t) => t.category === 'booking');
  const vendorTemplates = emailTemplates.filter((t) => t.category === 'vendor');

  // Get current template info
  const currentTemplate = getTemplateById(selectedTemplate);

  // Generate email HTML when template changes
  useEffect(() => {
    const generateEmailHtml = async () => {
      const TemplateComponent = templateComponents[selectedTemplate];
      const previewData = getTemplatePreviewData(selectedTemplate);
      const html = await render(TemplateComponent(previewData));
      setEmailHtml(html);
    };

    generateEmailHtml();
  }, [selectedTemplate]);

  const handleTemplateChange = async (value: EmailTemplateType) => {
    setSelectedTemplate(value);
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);

    try {
      const result = await sendTestEmail({
        templateId: selectedTemplate,
        recipientEmail: testEmail,
      });

      if (result.success) {
        toast.success('Test email sent successfully!', {
          description: `Sent to ${testEmail}`,
        });
        setTestEmail('');
      } else {
        toast.error('Failed to send test email', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Failed to send test email', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setSending(false);
    }
  };

  const previewWidth = previewMode === 'desktop' ? '600px' : '375px';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground mt-1">
          Preview email templates and send test emails
        </p>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Side - Controls */}
        <div className="col-span-4 space-y-6">
          {/* Template Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Template</CardTitle>
              <CardDescription>Choose an email template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Authentication</SelectLabel>
                    {authTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Booking</SelectLabel>
                    {bookingTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Vendor</SelectLabel>
                    {vendorTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {currentTemplate && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">{currentTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentTemplate.description}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Subject:</span>{' '}
                    {currentTemplate.subject}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Test Email */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>Send to any email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="john@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={sending}
                />
              </div>
              <Button
                onClick={handleSendTest}
                disabled={sending}
                className="w-full"
              >
                {sending ? 'Sending...' : 'Send Test Email'}
              </Button>
              <p className="text-xs text-muted-foreground">
                The email will be sent with sample data for preview purposes.
              </p>
            </CardContent>
          </Card>

          {/* Preview Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Mode</CardTitle>
              <CardDescription>Choose preview size</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('desktop')}
                  className="w-full"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('mobile')}
                  className="w-full"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {previewMode === 'desktop' ? '600px width' : '375px width'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Preview */}
        <div className="col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>Preview with sample data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div
                  className="border rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300"
                  style={{ width: previewWidth }}
                >
                  <iframe
                    srcDoc={emailHtml}
                    className="w-full h-[700px]"
                    title="Email Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
