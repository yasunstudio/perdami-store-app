'use client'

import { Plus } from 'lucide-react'
import { FloatingActionButton } from '@/components/ui/floating-action-button'

export function TestFAB() {
  return (
    <div className="p-4">
      <h1>Test FAB Component</h1>
      <p>Scroll down to see if FAB is visible and accessible</p>
      
      {/* Create long content to test scrolling */}
      {Array.from({ length: 50 }, (_, i) => (
        <div key={i} className="p-4 mb-4 border rounded">
          <h2>Item {i + 1}</h2>
          <p>This is content item {i + 1}. Keep scrolling to test FAB visibility.</p>
        </div>
      ))}
      
      <FloatingActionButton
        onClick={() => {
          alert('FAB clicked!')
          console.log('FAB is working!')
        }}
        icon={<Plus className="h-5 w-5" />}
        title="Test FAB"
      />
    </div>
  )
}
