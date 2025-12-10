'use client';

/**
 * Monthly Statement Download Button
 * Allows businesses to download PDF monthly statements
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/business/(portal)/components/ui/select';
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function StatementDownloadButton() {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Generate years (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const handleDownload = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select both month and year');
      return;
    }

    try {
      setDownloading(true);

      const response = await fetch(
        `/api/business/wallet/statements/${selectedYear}/${selectedMonth}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download statement');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${selectedYear}-${selectedMonth.padStart(2, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Statement downloaded successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download statement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Download Statement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Monthly Statement</DialogTitle>
          <DialogDescription>
            Select the month and year for the statement you want to download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={downloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!selectedMonth || !selectedYear || downloading}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
