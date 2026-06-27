import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CaseSelector({ cases = [], value, onChange, placeholder = "חפש תיק..." }) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedCase = cases.find((c) => c.id === value)

  const filteredCases = cases.filter((c) => 
    c.case_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.case_number.includes(searchQuery)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right font-normal"
        >
          {selectedCase ? (
             <span className="truncate flex items-center gap-2">
                <span className="font-semibold">{selectedCase.case_name}</span>
                <span className="text-slate-500 text-xs">#{selectedCase.case_number}</span>
             </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="w-full">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-right dir-rtl"
                placeholder="הקלד שם תיק או מספר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            {filteredCases.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-500">לא נמצאו תיקים</div>
            )}
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="cursor-pointer text-slate-500"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                ללא שיוך לתיק
              </CommandItem>
              {filteredCases.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={(currentValue) => {
                    onChange(c.id === value ? null : c.id)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{c.case_name}</span>
                    <span className="text-xs text-slate-400">#{c.case_number}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}