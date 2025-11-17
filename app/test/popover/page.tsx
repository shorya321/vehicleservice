'use client'

import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState } from 'react'
import { format } from 'date-fns'

export default function TestPopoverPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Test Popover and Calendar</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Popover Test</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                Open popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="grid gap-4">
                <h4 className="font-medium leading-none">Test Popover</h4>
                <p className="text-sm text-muted-foreground">
                  This is a test popover content.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Calendar Popover Test</h2>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate)
                    setIsOpen(false)
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
          <pre className="bg-muted p-4 rounded">
            {JSON.stringify({
              selectedDate: date?.toISOString(),
              isOpen,
              radixUIVersion: 'Check package.json'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}