'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TestInputPage() {
  const [value, setValue] = useState('')
  const [count, setCount] = useState(0)

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Test Input Page</h1>
      
      <div>
        <label>Basic Input:</label>
        <Input 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type here..."
        />
        <p>Value: {value}</p>
      </div>

      <div>
        <label>Counter:</label>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setCount(count - 1)}>-</Button>
          <span>{count}</span>
          <Button onClick={() => setCount(count + 1)}>+</Button>
        </div>
      </div>

      <div>
        <label>Date Input:</label>
        <Input type="date" />
      </div>
    </div>
  )
}