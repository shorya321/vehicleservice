/**
 * Business UI Component Library
 * Export all business-specific UI components
 *
 * SCOPE: Business module ONLY
 */

// Cards
export {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  LuxuryCardFooter,
  luxuryCardVariants,
} from './luxury-card';

export { HeroStatCard } from './hero-stat-card';
export { CompactStatCard } from './compact-stat-card';

export {
  ActionCard,
  QuickActionsGrid,
  NewBookingAction,
  WalletAction,
  ViewBookingsAction,
  SettingsAction,
} from './action-card';

// Buttons
export {
  LuxuryButton,
  LuxuryIconButton,
  luxuryButtonVariants,
} from './luxury-button';

// Inputs
export {
  LuxuryInput,
  LuxuryTextarea,
  LuxuryLabel,
  LuxuryFormGroup,
  luxuryInputVariants,
} from './luxury-input';

// Tables
export {
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableFooter,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,
  LuxuryTableCaption,
  LuxuryTableEmpty,
} from './luxury-table';

// Badges
export {
  StatusBadge,
  BookingStatusBadge,
  PaymentStatusBadge,
  AccountStatusBadge,
  statusBadgeVariants,
} from './status-badge';

// Dialog/Modal
export {
  LuxuryDialog,
  LuxuryDialogPortal,
  LuxuryDialogOverlay,
  LuxuryDialogClose,
  LuxuryDialogTrigger,
  LuxuryDialogContent,
  LuxuryDialogHeader,
  LuxuryDialogFooter,
  LuxuryDialogTitle,
  LuxuryDialogDescription,
} from './luxury-dialog';

// Alert Dialog (Confirmation Modal)
export {
  LuxuryAlertDialog,
  LuxuryAlertDialogPortal,
  LuxuryAlertDialogOverlay,
  LuxuryAlertDialogTrigger,
  LuxuryAlertDialogContent,
  LuxuryAlertDialogHeader,
  LuxuryAlertDialogFooter,
  LuxuryAlertDialogTitle,
  LuxuryAlertDialogDescription,
  LuxuryAlertDialogAction,
  LuxuryAlertDialogCancel,
} from './luxury-alert-dialog';

// Tabs
export {
  LuxuryTabs,
  LuxuryTabsList,
  LuxuryTabsTrigger,
  LuxuryTabsContent,
} from './luxury-tabs';

// Checkbox
export { LuxuryCheckbox } from './luxury-checkbox';

// Switch
export { LuxurySwitch } from './luxury-switch';

// Alert
export { LuxuryAlert, luxuryAlertVariants } from './luxury-alert';

// Tooltip
export {
  LuxuryTooltip,
  LuxuryTooltipTrigger,
  LuxuryTooltipContent,
  LuxuryTooltipProvider,
} from './luxury-tooltip';

// Empty State
export { EmptyState } from './empty-state';

// Skeleton Loading
export {
  LuxurySkeleton,
  LuxurySkeletonText,
  LuxurySkeletonCard,
  LuxurySkeletonTable,
  LuxurySkeletonStatCard,
} from './luxury-skeleton';

// Dropdown Menu
export {
  LuxuryDropdownMenu,
  LuxuryDropdownMenuTrigger,
  LuxuryDropdownMenuContent,
  LuxuryDropdownMenuItem,
  LuxuryDropdownMenuCheckboxItem,
  LuxuryDropdownMenuRadioItem,
  LuxuryDropdownMenuLabel,
  LuxuryDropdownMenuSeparator,
  LuxuryDropdownMenuShortcut,
  LuxuryDropdownMenuGroup,
  LuxuryDropdownMenuPortal,
  LuxuryDropdownMenuSub,
  LuxuryDropdownMenuSubContent,
  LuxuryDropdownMenuSubTrigger,
  LuxuryDropdownMenuRadioGroup,
} from './luxury-dropdown';

// Separator
export { LuxurySeparator } from './luxury-separator';

// Select
export {
  LuxurySelect,
  LuxurySelectGroup,
  LuxurySelectValue,
  LuxurySelectTrigger,
  LuxurySelectContent,
  LuxurySelectLabel,
  LuxurySelectItem,
  LuxurySelectSeparator,
  LuxurySelectScrollUpButton,
  LuxurySelectScrollDownButton,
} from './luxury-select';

// ============================================
// SHADCN/UI COMPONENTS
// Standard shadcn components for business portal
// ============================================

// shadcn Button
export { Button, buttonVariants } from './button';

// shadcn Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

// shadcn Badge
export { Badge, badgeVariants } from './badge';

// shadcn Avatar
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// shadcn Skeleton
export { Skeleton } from './skeleton';

// shadcn Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// shadcn Separator
export { Separator } from './separator';

// shadcn Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip';

// shadcn Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

// shadcn Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

// shadcn Alert
export { Alert, AlertTitle, AlertDescription } from './alert';

// shadcn Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

// shadcn Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// shadcn Input
export { Input } from './input';

// shadcn Checkbox
export { Checkbox } from './checkbox';

// shadcn Switch
export { Switch } from './switch';

// shadcn Progress
export { Progress } from './progress';
