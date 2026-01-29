'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type SearchableDropdownItem = {
  value: string
  label: string
  description?: string
}

export function SearchableDropdown(props: {
  value: string
  onValueChange: (value: string) => void
  items: SearchableDropdownItem[]
  placeholder: string
  label?: string
  disabled?: boolean
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}) {
  const {
    value,
    onValueChange,
    items,
    placeholder,
    label,
    disabled,
    searchPlaceholder = 'Search…',
    emptyText = 'No matches',
    className,
  } = props

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => items.find((i) => i.value === value) || null,
    [items, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => {
      const hay = `${i.label} ${i.description || ''} ${i.value}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        {label ? (
          <>
            <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
              {label}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <div className="p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
              onKeyDown={(e) => {
                // Prevent dropdown from treating keystrokes as item selects.
                e.stopPropagation()
              }}
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            filtered.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onSelect={() => {
                  onValueChange(item.value)
                  setOpen(false)
                }}
                className="flex items-start gap-2 px-2 py-2"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{item.label}</span>
                  {item.description ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </div>
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    value === item.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
