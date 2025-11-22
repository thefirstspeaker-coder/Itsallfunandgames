import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const prettifyFilterValue = (value: string) => {
  if (value === value.toLowerCase()) {
    return value
      .split(/[-_]/)
      .map((part) =>
        part
          .split(" ")
          .map((word) =>
            word.length > 0
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word
          )
          .join(" ")
      )
      .join(" ");
  }
  return value;
};
