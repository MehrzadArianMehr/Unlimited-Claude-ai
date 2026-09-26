'use client'
// Mehrzad ArianMehr©

import ReactMarkdown from 'react-markdown'
import { memo } from 'react'

/**
 * Lightweight markdown renderer used inside chat message bubbles.
 * Uses the global `.uc-prose` styles defined in globals.css.
 */
export const Markdown = memo(function Markdown({
  content,
}: {
  content: string
}) {
  return (
    <div className="uc-prose">
      <ReactMarkdown
        components={{
          // open all links in a new tab
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
