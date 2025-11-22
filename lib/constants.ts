import {
    Activity,
    Brain,
    CircleDashed,
    Globe2,
    Handshake,
    Map,
    MapPinned,
    MoonStar,
    Music,
    PartyPopper,
    School,
    Scissors,
    ScrollText,
    Search as SearchIcon,
    Sparkles,
    Tag,
    Users,
    UsersRound,
    Volleyball,
    Wrench,
    LucideIcon,
} from "lucide-react";

export const facetKeys = [
    "category",
    "tags",
    "traditionality",
    "prepLevel",
    "skillsDeveloped",
    "regionalPopularity",
] as const;

export type FacetKey = (typeof facetKeys)[number];

export const categoryIcons: Record<string, LucideIcon> = {
    Group: UsersRound,
    Party: PartyPopper,
    Wide: Map,
};

export const tagIcons: Partial<Record<string, LucideIcon>> = {
    "wide-area": MapPinned,
    tag: Tag,
    circle: CircleDashed,
    memory: Brain,
    "classroom-friendly": School,
    active: Activity,
    ball: Volleyball,
    "hide-and-seek": SearchIcon,
    night: MoonStar,
    "paper-craft": Scissors,
    music: Music,
    teamwork: Handshake,
};

export const filterMeta: Record<
    FacetKey,
    {
        label: string;
        description: string;
        icon: LucideIcon;
        optionIcons?: Partial<Record<string, LucideIcon>>;
        emphasizedSearch?: boolean;
    }
> = {
    category: {
        label: "Group",
        description: "Choose the type of group you're playing with.",
        icon: Users,
        optionIcons: categoryIcons,
    },
    tags: {
        label: "Type",
        description: "Pick the vibe or activity style.",
        icon: Tag,
        optionIcons: tagIcons,
    },
    traditionality: {
        label: "Traditionality",
        description: "Explore classics or contemporary twists.",
        icon: ScrollText,
    },
    prepLevel: {
        label: "Prep Level",
        description: "How much setup time do you have?",
        icon: Wrench,
    },
    skillsDeveloped: {
        label: "Skills",
        description: "Focus on the skills you want to encourage.",
        icon: Sparkles,
        emphasizedSearch: true,
    },
    regionalPopularity: {
        label: "Region",
        description: "See what's popular in different places.",
        icon: Globe2,
    },
};
