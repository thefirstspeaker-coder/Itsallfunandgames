import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row list-none items-center gap-1", className)}
      {...props}
    />
  )
}

export function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />
}

export function PaginationLink(
  { className, isActive = false, ...props }: React.ComponentProps<"a"> & { isActive?: boolean }
) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border bg-background p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-marigold focus-visible:ring-offset-2",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export function PaginationPrevious({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("gap-1 pr-2", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
    </PaginationLink>
  )
}

export function PaginationNext({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("gap-1 pl-2", className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("flex h-8 w-8 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

