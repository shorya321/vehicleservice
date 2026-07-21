'use client';

/**
 * Profile Page Content
 * Composes the member's own identity surfaces.
 */

import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { FadeIn } from '@/components/business/motion';
import { AvatarUpload } from './avatar-upload';
import { DisplayNameForm } from './display-name-form';
import { PasswordForm } from './password-form';

interface ProfilePageContentProps {
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export function ProfilePageContent({
  displayName,
  email,
  role,
  avatarUrl,
}: ProfilePageContentProps) {
  const isOwner = role === 'owner';

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Your name, photo and password" />

      <FadeIn>
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Your role
              </p>
              <p className="flex items-center gap-2 font-medium capitalize text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                {isOwner ? 'Owner' : 'Staff'}
              </p>
            </div>
            <Badge variant={isOwner ? 'default' : 'secondary'}>
              {isOwner ? 'Full account access' : 'Bookings access'}
            </Badge>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <AvatarUpload currentAvatarUrl={avatarUrl} displayName={displayName || null} />
      </FadeIn>

      <FadeIn delay={0.15}>
        <DisplayNameForm displayName={displayName} email={email} />
      </FadeIn>

      <FadeIn delay={0.2}>
        <PasswordForm />
      </FadeIn>
    </PageContainer>
  );
}
