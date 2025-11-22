import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PaginationControl({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationControlProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="space-y-4">
            <Pagination>
                <PaginationContent>
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                            <PaginationLink
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    onPageChange(i + 1);
                                }}
                                isActive={currentPage === i + 1}
                                className={`border border-brand-sprout/30 bg-white text-sm font-medium text-text-brand hover:bg-brand-sprout/10 hover:text-text-brand ${currentPage === i + 1 ? "bg-surface-highlight" : ""
                                    }`}
                            >
                                {i + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                </PaginationContent>
            </Pagination>
            <div className="flex items-center justify-center gap-3">
                <Button
                    variant="outline"
                    className="rounded-full border-brand-sprout/40 bg-white px-5 text-sm font-semibold text-text-brand hover:bg-brand-sprout/10"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    className="rounded-full bg-brand-marigold px-5 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
