import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FacetKey, facetKeys, filterMeta } from "@/lib/constants";
import { prettifyFilterValue, cn } from "@/lib/utils";
import { Filter, PanelLeftClose, PanelLeftOpen, Search as SearchIcon, X } from "lucide-react";

interface FilterSidebarProps {
    filters: Record<FacetKey, string[]> & { page: number; query: string };
    facets: Record<FacetKey, string[]>;
    filterSearches: Record<FacetKey, string>;
    setFilterSearches: React.Dispatch<React.SetStateAction<Record<FacetKey, string>>>;
    isFilterRailCollapsed: boolean;
    setIsFilterRailCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    isFilterSheetOpen: boolean;
    closeFilterSheet: () => void;
    resetFilters: () => void;
    updateFilterValue: (key: FacetKey, value: string, include: boolean) => void;
    clearFilterGroup: (key: FacetKey) => void;
    openFilterSheet: (key?: FacetKey) => void;
    initialExpandedFilters?: FacetKey[];
}

export function FilterSidebar({
    filters,
    facets,
    filterSearches,
    setFilterSearches,
    isFilterRailCollapsed,
    setIsFilterRailCollapsed,
    isFilterSheetOpen,
    closeFilterSheet,
    resetFilters,
    updateFilterValue,
    clearFilterGroup,
    openFilterSheet,
    initialExpandedFilters = [],
}: FilterSidebarProps) {
    const hasActiveFilters = facetKeys.some((key) => filters[key].length > 0);

    const filterGroups = facetKeys
        .map((key) => {
            const meta = filterMeta[key];
            const options = [...(facets[key] ?? [])];
            return {
                ...meta,
                key,
                options,
                showSearch: meta.emphasizedSearch || options.length > 8,
            };
        })
        .filter((group) => group.options.length > 0);

    const renderFilterPanel = (variant: "rail" | "sheet") => {
        const isSheet = variant === "sheet";
        return (
            <div className="flex h-full flex-col gap-6">
                <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-text-brand">
                                Refine games
                            </h2>
                            <p className="text-sm text-text-brand/70">
                                Tailor filters to match your group.
                            </p>
                        </div>
                        {isSheet ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-surface-highlight text-text-brand hover:bg-brand-sprout/20"
                                onClick={closeFilterSheet}
                                aria-label="Close filters"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : hasActiveFilters ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-surface-highlight"
                                onClick={resetFilters}
                            >
                                Clear all
                            </Button>
                        ) : null}
                    </div>
                    <div className="h-px bg-brand-sprout/20" />
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                    <Accordion
                        type="multiple"
                        defaultValue={initialExpandedFilters}
                        className="flex flex-col gap-3"
                    >
                        {filterGroups.map((group) => {
                            const {
                                key,
                                label,
                                description,
                                icon: Icon,
                                optionIcons,
                                options,
                                showSearch,
                            } = group;
                            const selectedCount = filters[key].length;
                            const searchTerm = filterSearches[key].toLowerCase().trim();
                            const visibleOptions =
                                searchTerm.length > 0
                                    ? options.filter((option) =>
                                        option.toLowerCase().includes(searchTerm)
                                    )
                                    : options;

                            return (
                                <AccordionItem
                                    key={key}
                                    value={key}
                                    className="overflow-hidden rounded-2xl border border-brand-sprout/20 bg-surface-raised shadow-sm"
                                    id={`filter-group-${key}`}
                                >
                                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-text-brand hover:text-brand-sprout">
                                        <span className="flex w-full items-center gap-2">
                                            <Icon className="h-4 w-4 text-brand-sprout" />
                                            <span>{label}</span>
                                            {selectedCount > 0 && (
                                                <Badge className="ml-auto rounded-full bg-surface-highlight px-2 py-1 text-[11px] font-semibold text-brand-sprout">
                                                    {selectedCount}
                                                </Badge>
                                            )}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4">
                                        <p className="mb-3 text-xs text-text-brand/70">{description}</p>
                                        {showSearch && (
                                            <div className="relative mb-3">
                                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-sprout/70" />
                                                <Input
                                                    value={filterSearches[key]}
                                                    onChange={(event) =>
                                                        setFilterSearches((prev) => ({
                                                            ...prev,
                                                            [key]: event.target.value,
                                                        }))
                                                    }
                                                    placeholder={`Search ${label.toLowerCase()}`}
                                                    className="h-9 rounded-full border border-brand-sprout/30 bg-white pl-9 text-sm focus-visible:ring-brand-marigold"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2 overflow-hidden rounded-2xl border border-brand-sprout/20 bg-surface-sunken p-2">
                                            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                                                {visibleOptions.length > 0 ? (
                                                    visibleOptions.map((option) => {
                                                        const isChecked = filters[key].includes(option);
                                                        const OptionIcon = optionIcons?.[option];
                                                        return (
                                                            <label
                                                                key={option}
                                                                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isChecked
                                                                        ? "bg-surface-highlight text-text-brand shadow-inner"
                                                                        : "hover:bg-brand-sprout/10"
                                                                    }`}
                                                            >
                                                                <Checkbox
                                                                    className="h-4 w-4 border-brand-sprout/50 data-[state=checked]:border-brand-sprout data-[state=checked]:bg-brand-sprout data-[state=checked]:text-white"
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateFilterValue(key, option, checked === true)
                                                                    }
                                                                />
                                                                {OptionIcon && (
                                                                    <OptionIcon className="h-4 w-4 text-brand-sprout" />
                                                                )}
                                                                <span className="flex-1 text-sm">
                                                                    {prettifyFilterValue(option)}
                                                                </span>
                                                            </label>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="px-3 py-6 text-center text-xs text-text-brand/60">
                                                        No matches for “{filterSearches[key]}”.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {selectedCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-3 h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-surface-highlight"
                                                onClick={() => clearFilterGroup(key)}
                                            >
                                                Clear {label}
                                            </Button>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
                {isSheet && (
                    <div className="mt-auto flex flex-col gap-3 border-t border-brand-sprout/20 pt-4">
                        <Button
                            className="h-11 rounded-full bg-brand-marigold text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
                            onClick={closeFilterSheet}
                        >
                            Apply filters
                        </Button>
                        <Button
                            variant="outline"
                            className="h-11 rounded-full border-brand-sprout/40 bg-white text-sm font-semibold text-brand-sprout transition hover:bg-brand-sprout/10"
                            onClick={() => {
                                resetFilters();
                                closeFilterSheet();
                            }}
                        >
                            Clear all
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <aside
                className={cn(
                    "flex flex-shrink-0 flex-col transition-all duration-300 ease-in-out",
                    isFilterRailCollapsed ? "w-16" : "sm:w-64 lg:w-72"
                )}
            >
                <div
                    className={cn(
                        "sticky top-6 flex flex-col items-stretch",
                        isFilterRailCollapsed
                            ? "gap-4 rounded-3xl border border-brand-sprout/30 bg-surface-raised p-3 shadow-sm backdrop-blur"
                            : "rounded-3xl border border-brand-sprout/30 bg-surface-raised p-4 shadow-sm backdrop-blur"
                    )}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 self-end rounded-full bg-surface-highlight text-text-brand hover:bg-brand-sprout/20"
                        onClick={() => setIsFilterRailCollapsed((prev) => !prev)}
                        aria-label={
                            isFilterRailCollapsed ? "Expand filters" : "Collapse filters"
                        }
                    >
                        {isFilterRailCollapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </Button>
                    {isFilterRailCollapsed ? (
                        <div className="flex flex-1 flex-col items-center gap-2 py-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-2xl bg-surface-highlight text-text-brand transition hover:bg-brand-sprout/25"
                                onClick={() => openFilterSheet()}
                                aria-label="Open filters"
                            >
                                <Filter className="h-5 w-5 text-brand-sprout" />
                            </Button>
                            <div className="mt-2 flex flex-1 flex-col items-center gap-2">
                                {filterGroups.map((group) => {
                                    const Icon = group.icon;
                                    const selectedCount = filters[group.key].length;
                                    return (
                                        <button
                                            key={group.key}
                                            type="button"
                                            onClick={() => openFilterSheet(group.key)}
                                            className={cn(
                                                "relative flex h-11 w-11 items-center justify-center rounded-2xl text-text-brand transition",
                                                selectedCount > 0
                                                    ? "bg-brand-sprout/20 text-brand-sprout"
                                                    : "bg-surface-sunken hover:bg-surface-highlight"
                                            )}
                                            aria-label={`Edit ${group.label} filters`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {selectedCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-marigold px-1 text-[11px] font-semibold text-brand-ink">
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4">{renderFilterPanel("rail")}</div>
                    )}
                </div>
            </aside>
            {isFilterSheetOpen && (
                <div
                    className="fixed inset-0 z-40 flex items-start justify-end bg-brand-ink/40 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    onClick={closeFilterSheet}
                >
                    <div
                        className="h-full w-full max-w-md overflow-y-auto border-l border-brand-sprout/30 bg-surface-sunken px-6 pb-8 pt-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {renderFilterPanel("sheet")}
                    </div>
                </div>
            )}
        </>
    );
}
