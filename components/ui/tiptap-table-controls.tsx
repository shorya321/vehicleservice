'use client'

import { useEditorState, type Editor } from '@tiptap/react'
// Loads the table commands (insertTable, addRowAfter...) into the chain's types.
import type {} from '@tiptap/extension-table'
import {
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Grid2x2X,
  PanelTop,
  Table as TableIcon,
  TableColumnsSplit,
  TableRowsSplit,
} from 'lucide-react'
import { ToolbarButton, ToolbarSeparator } from './tiptap-toolbar-button'

interface TiptapTableControlsProps {
  editor: Editor
  iconSize: number
}

/**
 * Insert-table button, plus row/column tools that appear only while the
 * cursor is inside a table. `useEditorState` re-renders on selection moves,
 * which the editor's own onUpdate does not.
 */
export function TiptapTableControls({ editor, iconSize }: TiptapTableControlsProps) {
  const { inTable, headerRow } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      inTable: e.isActive('table'),
      headerRow: e.isActive('tableHeader'),
    }),
  })

  const run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => () =>
    command(editor.chain().focus()).run()

  return (
    <>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
        isActive={inTable}
        title="Insert table"
      >
        <TableIcon size={iconSize} />
      </ToolbarButton>

      {inTable && (
        <>
          <ToolbarButton onClick={run((c) => c.addRowAfter())} title="Add row below">
            <BetweenHorizontalEnd size={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={run((c) => c.addColumnAfter())} title="Add column right">
            <BetweenVerticalEnd size={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={run((c) => c.deleteRow())} title="Delete row">
            <TableRowsSplit size={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={run((c) => c.deleteColumn())} title="Delete column">
            <TableColumnsSplit size={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={run((c) => c.toggleHeaderRow())} isActive={headerRow} title="Toggle header row">
            <PanelTop size={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={run((c) => c.deleteTable())} title="Delete table">
            <Grid2x2X size={iconSize} />
          </ToolbarButton>
        </>
      )}
    </>
  )
}
