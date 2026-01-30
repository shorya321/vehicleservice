'use client';

/**
 * Payment Method Card Component
 * Individual payment method with animations and luxury styling
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'motion/react';
import { CreditCard, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  payment_method_type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_funding?: string;
  is_default: boolean;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}

// Card brand icons with CSS variable colors
// Brand backgrounds are standardized dark colors, using contrast text for accessibility
function CardBrandIcon({ brand }: { brand?: string }) {
  const brandLower = brand?.toLowerCase();

  // Visa icon - Navy blue background (#1A1F71) - matching HTML design
  if (brandLower === 'visa') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1f71] text-white text-xs font-bold">
        VISA
      </div>
    );
  }

  // Mastercard icon
  if (brandLower === 'mastercard') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <div className="relative w-7 h-5">
          <div className="absolute left-0 w-4 h-4 rounded-full bg-[#EB001B]" />
          <div className="absolute right-0 w-4 h-4 rounded-full bg-[#F79E1B]" />
        </div>
      </div>
    );
  }

  // Amex icon - Blue background (#006FCF)
  if (brandLower === 'amex' || brandLower === 'american_express') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#006FCF]">
        <span className="text-white text-[8px] font-bold">AMEX</span>
      </div>
    );
  }

  // Discover icon - Orange background (#FF6000)
  if (brandLower === 'discover') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6000]">
        <span className="text-white text-[8px] font-bold">DISC</span>
      </div>
    );
  }

  // Default card icon
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
      <CreditCard className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function formatCardBrand(brand?: string): string {
  if (!brand) return 'Card';
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    american_express: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function PaymentMethodCard({
  paymentMethod: pm,
  onSetDefault,
  onDelete,
  isSettingDefault,
  isDeleting,
}: PaymentMethodCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <div
      className={cn(
        'group flex items-center justify-between p-4 rounded-xl',
        'border border-border',
        'bg-muted/30 hover:bg-muted/50',
        'transition-all duration-200'
      )}
    >
      {/* Payment Method Info */}
      <div className="flex items-center gap-4">
        <CardBrandIcon brand={pm.card_brand} />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{formatCardBrand(pm.card_brand)}</span>
            <span className="text-muted-foreground">**** {pm.card_last4}</span>
            {pm.is_default && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20">
                DEFAULT
              </span>
            )}
            {pm.card_funding && pm.card_funding !== 'credit' && (
              <Badge className="bg-muted text-muted-foreground border border-border text-xs capitalize">
                {pm.card_funding}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pm.card_exp_month && pm.card_exp_year && (
              <>
                Expires <span className="text-foreground">{pm.card_exp_month.toString().padStart(2, '0')}</span>/<span className="text-foreground">{pm.card_exp_year.toString().slice(-2)}</span>
              </>
            )}
            {pm.last_used_at && (
              <>
                <span className="mx-2 text-muted-foreground/50">|</span>
                Last used <span className="text-foreground">{new Date(pm.last_used_at).toLocaleDateString()}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Delete Action */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={isDeleting}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Payment Method?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(pm.id)}
              className="bg-red-500 hover:bg-red-500/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (prefersReducedMotion) {
    return content;
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {content}
    </motion.div>
  );
}
