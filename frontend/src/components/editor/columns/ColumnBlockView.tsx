'use client'

import React from 'react'
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { Trash } from 'lucide-react'

export function ColumnBlockView({ node, getPos, editor }: NodeViewProps) {
  // Check if this is the first column by examining its position in parent
  const isFirstColumn = typeof getPos === 'function' && editor?.state.doc.resolve(getPos()).index() === 0;

  // Function to delete the entire column layout
  const deleteColumnLayout = () => {
    if (editor) {
      editor.commands.deleteColumnLayout();
    }
  };

  return (
    <NodeViewWrapper className="column-block-wrapper relative flex-1 min-w-0">
      <div className="absolute -top-6 left-0 text-xs text-muted-foreground bg-background px-2 py-1 rounded-t-md border border-b-0 border-muted flex items-center">
        <span>Column</span>
        {isFirstColumn && (
          <button
            type="button"
            className="ml-2 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={deleteColumnLayout}
            title="Delete column layout"
          >
            <Trash className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="column-block p-3 border-2 border-dashed border-muted-foreground/20 bg-white dark:bg-zinc-900 rounded-md min-h-[100px] h-full">
        <NodeViewContent className="column-content" />
      </div>
    </NodeViewWrapper>
  )
} 