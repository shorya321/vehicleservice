'use client';

/**
 * Bookings Page Content
 * Clean shadcn design with gold accent
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Plus,
  CalendarCheck,
  Search,
  ArrowRight,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Trash2,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/business/(portal)/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/business/(portal)/components/ui/select';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { toast } from 'sonner';
import { EditDateTimeModal } from './edit-datetime-modal';
import { canModifyBookingDateTime } from '@/lib/business/booking-utils';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
  from_locations: { name: string; city: string } | null;
  to_locations: { name: string; city: string } | null;
  vehicle_types: { name: string } | null;
  created_at: string;
}

interface BookingsPageContentProps {
  bookings: Booking[];
  totalCount: number;
  pendingCount: number;
}

// Map booking status to UI status
function mapBookingStatus(
  status: string
): 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' {
  const statusMap: Record<
    string,
    'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  > = {
    pending: 'pending',
    confirmed: 'confirmed',
    assigned: 'confirmed',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
    refunded: 'cancelled',
  };
  return statusMap[status] || 'pending';
}


export function BookingsPageContent({
  bookings,
  totalCount,
  pendingCount,
}: BookingsPageContentProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats
  const completedCount = bookings.filter(
    (b) => b.booking_status === 'completed'
  ).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || booking.booking_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBookings.length);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Selection handlers - select all on current page
  const toggleSelectAll = () => {
    const currentPageBookingIds = paginatedBookings.map((b) => b.id);
    const allCurrentPageSelected = currentPageBookingIds.every((id) => selectedBookings.has(id));

    if (allCurrentPageSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedBookings);
      currentPageBookingIds.forEach((id) => newSelected.delete(id));
      setSelectedBookings(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedBookings);
      currentPageBookingIds.forEach((id) => newSelected.add(id));
      setSelectedBookings(newSelected);
    }
  };

  const toggleSelectBooking = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  // Check selection state for current page
  const currentPageBookingIds = paginatedBookings.map((b) => b.id);
  const isAllSelected = paginatedBookings.length > 0 && currentPageBookingIds.every((id) => selectedBookings.has(id));
  const isSomeSelected = selectedBookings.size > 0 && !isAllSelected;

  // Delete handlers
  const handleDeleteSingle = async (bookingId: string) => {
    setBookingToDelete(bookingId);
    setShowDeleteDialog(true);
  };

  const handleBulkDelete = () => {
    if (selectedBookings.size === 0) return;
    setBookingToDelete(null);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (bookingToDelete) {
        // Single delete
        const response = await fetch(`/api/business/bookings/${bookingToDelete}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete booking');
        }
        toast.success('Booking deleted successfully');
      } else {
        // Bulk delete
        const response = await fetch('/api/business/bookings/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_ids: Array.from(selectedBookings) }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete bookings');
        }
        toast.success(`${result.data.deleted_count} booking(s) deleted successfully`);
        setSelectedBookings(new Set());
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  // Refined animations - faster, subtler
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  // Row animation - pure fade, no movement
  const rowVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { duration: 0.2, delay: i * 0.03 },
    }),
  };

  return (
    <div className="pb-12 space-y-6">
      {/* Header Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="font-business-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--business-text-primary)]"
          >
            Bookings
          </h1>
          <p className="font-business-body text-[var(--business-text-muted)] text-sm sm:text-base mt-1">
            Manage your bookings
          </p>
        </div>
      </motion.div>

      {/* Stats Row - Clean Minimal Cards */}
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Bookings Card */}
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="group relative overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Total Bookings
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {totalCount}
                </p>
                {totalCount > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+12% from last month</span>
                  </div>
                )}
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20"
              >
                <CalendarCheck className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Revenue Card */}
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="group relative overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Revenue
                </p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This period
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20"
              >
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Pending Card */}
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="group relative overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Pending
                </p>
                <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {pendingCount > 0 ? "Needs attention" : "All clear"}
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 dark:bg-amber-500/20"
              >
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Completed Card */}
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="group relative overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Completed
                </p>
                <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                  {completedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Successfully done
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/10 dark:bg-sky-500/20"
              >
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Status Filter Dropdown */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[160px] rounded-lg bg-muted border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              All Status
            </SelectItem>
            <SelectItem value="pending" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              Pending
            </SelectItem>
            <SelectItem value="confirmed" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              Confirmed
            </SelectItem>
            <SelectItem value="completed" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              Completed
            </SelectItem>
            <SelectItem value="cancelled" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Bulk Delete Button - Shows when items selected */}
        {selectedBookings.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selectedBookings.size})
          </Button>
        )}

        {/* New Booking Button */}
        <Button asChild className="ml-auto gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
          <Link href="/business/bookings/new">
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <div>
            {filteredBookings.length === 0 ? (
              <EmptyBookingsState hasFilter={searchQuery !== '' || statusFilter !== 'all'} />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  {/* Table Header */}
                  <div className="bg-muted/50 border-b border-border">
                    <div className="grid grid-cols-[40px,1fr,1fr,1.5fr,100px,100px,80px] px-5 py-3 items-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement).dataset.state = isSomeSelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked';
                            }
                          }}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                          className="h-4 w-4 border-2 border-border rounded data-[state=unchecked]:bg-transparent hover:border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                        />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Date
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Customer
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Route
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Status
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground text-right">
                        Amount
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground text-center">
                        Actions
                      </span>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-border">
                    {paginatedBookings.map((booking, index) => (
                      <TableRow
                        key={booking.id}
                        booking={booking}
                        index={index}
                        prefersReducedMotion={prefersReducedMotion}
                        isSelected={selectedBookings.has(booking.id)}
                        onToggleSelect={() => toggleSelectBooking(booking.id)}
                        onDelete={() => handleDeleteSingle(booking.id)}
                        onRefresh={() => router.refresh()}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                  {paginatedBookings.map((booking, index) => (
                    <MobileBookingCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                      prefersReducedMotion={prefersReducedMotion}
                      isSelected={selectedBookings.has(booking.id)}
                      onToggleSelect={() => toggleSelectBooking(booking.id)}
                      onDelete={() => handleDeleteSingle(booking.id)}
                      onRefresh={() => router.refresh()}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {filteredBookings.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{startIndex + 1}-{endIndex}</span> of{' '}
                      <span className="font-medium text-foreground">{filteredBookings.length}</span> bookings
                    </p>
                    <div className="flex items-center gap-1">
                      {/* Previous Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page Numbers */}
                      {getPageNumbers().map((page, idx) =>
                        typeof page === 'number' ? (
                          <Button
                            key={idx}
                            variant={page === currentPage ? 'default' : 'ghost'}
                            size="icon"
                            className={cn(
                              'h-9 w-9',
                              page === currentPage && 'bg-primary text-primary-foreground font-medium'
                            )}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ) : (
                          <span key={idx} className="text-muted-foreground px-1">
                            {page}
                          </span>
                        )
                      )}

                      {/* Next Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setBookingToDelete(null);
            // Fix for DropdownMenu + AlertDialog pointer-events race condition
            setTimeout(() => {
              if (document.body.style.pointerEvents === 'none') {
                document.body.style.pointerEvents = '';
              }
            }, 300);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {bookingToDelete ? 'Delete Booking' : `Delete ${selectedBookings.size} Booking(s)`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bookingToDelete
                ? 'Are you sure you want to delete this booking? This action cannot be undone. If the booking was charged, the amount will be refunded to your wallet.'
                : `Are you sure you want to delete ${selectedBookings.size} booking(s)? This action cannot be undone. Any charged amounts will be refunded to your wallet.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Desktop Table Row - Clean, minimal
interface TableRowProps {
  booking: Booking;
  index: number;
  prefersReducedMotion: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function TableRow({ booking, index, prefersReducedMotion, isSelected, onToggleSelect, onDelete, onRefresh }: TableRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const canEditDateTime = canModifyBookingDateTime(booking);

  const pickupDate = new Date(booking.pickup_datetime);
  const formattedDate = pickupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      custom={index}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'group grid grid-cols-[40px,1fr,1fr,1.5fr,100px,100px,80px] px-5 py-4 items-center hover:bg-muted/50 border-l-2 border-transparent hover:border-l-primary transition-all duration-150 cursor-pointer',
        isSelected && 'bg-primary/5'
      )}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select booking ${booking.booking_number}`}
          className="h-4 w-4 border-2 border-border rounded data-[state=unchecked]:bg-transparent hover:border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
        />
      </div>

      {/* Date */}
      <Link href={`/business/bookings/${booking.id}`} className="block">
        <p className="text-sm font-medium text-foreground">
          {formattedDate}
        </p>
        <p className="text-xs text-muted-foreground">
          {formattedTime}
        </p>
      </Link>

      {/* Customer */}
      <Link href={`/business/bookings/${booking.id}`} className="block">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors">
          {booking.customer_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {booking.booking_number}
        </p>
      </Link>

      {/* Route */}
      <Link href={`/business/bookings/${booking.id}`} className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="truncate max-w-[120px]">
          {booking.from_locations?.name || 'N/A'}
        </span>
        <ArrowRight className="h-3 w-3 text-primary/50 flex-shrink-0" />
        <span className="truncate max-w-[120px]">
          {booking.to_locations?.name || 'N/A'}
        </span>
      </Link>

      {/* Status */}
      <StatusBadge status={mapBookingStatus(booking.booking_status)} />

      {/* Amount */}
      <span className="text-sm font-bold text-primary text-right">
        {formatCurrency(booking.total_price)}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/business/bookings/${booking.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canEditDateTime}
              onClick={() => setIsEditModalOpen(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Edit Time
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit DateTime Modal */}
      <EditDateTimeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        bookingId={booking.id}
        bookingNumber={booking.booking_number}
        currentDatetime={booking.pickup_datetime}
        onSuccess={onRefresh}
      />
    </motion.div>
  );
}

// Status Badge component for table
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    pending: {
      label: 'Pending',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    confirmed: {
      label: 'Confirmed',
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
    },
    'in-progress': {
      label: 'In Progress',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
    },
    completed: {
      label: 'Completed',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs rounded-full px-2.5 py-0.5 border',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      {config.label}
    </Badge>
  );
}

// Mobile Card
interface MobileBookingCardProps {
  booking: Booking;
  index: number;
  prefersReducedMotion: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function MobileBookingCard({
  booking,
  index,
  prefersReducedMotion,
  isSelected,
  onToggleSelect,
  onDelete,
  onRefresh,
}: MobileBookingCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const canEditDateTime = canModifyBookingDateTime(booking);

  const pickupDate = new Date(booking.pickup_datetime);
  const formattedDateTime = pickupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Card className={cn(
        'bg-card border border-border rounded-xl transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-primary/50 bg-primary/5'
      )}>
        <CardContent className="p-4">
          {/* Header: Checkbox + Status + Date */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelect}
                  aria-label={`Select booking ${booking.booking_number}`}
                  className="h-4 w-4 border-2 border-border rounded data-[state=unchecked]:bg-transparent hover:border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                />
              </div>
              <StatusBadge status={mapBookingStatus(booking.booking_status)} />
            </div>
            <span className="text-xs text-muted-foreground">
              {formattedDateTime}
            </span>
          </div>

          {/* Customer */}
          <Link href={`/business/bookings/${booking.id}`} className="block mb-3">
            <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {booking.customer_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {booking.booking_number}
            </p>
          </Link>

          {/* Route */}
          <Link href={`/business/bookings/${booking.id}`} className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{booking.from_locations?.name || 'N/A'}</span>
            <ArrowRight className="h-3 w-3 text-primary/50 flex-shrink-0" />
            <span className="truncate">{booking.to_locations?.name || 'N/A'}</span>
          </Link>

          {/* Footer: Price + Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(booking.total_price)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/business/bookings/${booking.id}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canEditDateTime}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Edit Time
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Edit DateTime Modal */}
          <EditDateTimeModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            bookingId={booking.id}
            bookingNumber={booking.booking_number}
            currentDatetime={booking.pickup_datetime}
            onSuccess={onRefresh}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty state component
function EmptyBookingsState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl mb-4 bg-primary/10">
        <CalendarCheck className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        {hasFilter ? 'No matching bookings' : 'No bookings yet'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {hasFilter
          ? "Try adjusting your search or filters to find what you're looking for"
          : 'Create your first booking to start managing your transfers'}
      </p>
      {!hasFilter && (
        <Button
          asChild
          className="gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          <Link href="/business/bookings/new">
            <Plus className="h-4 w-4" />
            Create Your First Booking
          </Link>
        </Button>
      )}
    </div>
  );
}
