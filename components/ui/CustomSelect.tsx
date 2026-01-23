"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

type Option = {
    value: string;
    label: string;
};

type CustomSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className = "",
    disabled = false,
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Update coordinates when opening
    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4, // 4px gap
                left: rect.left,
                width: rect.width,
            });
        }
    }, [open]);

    // Handle scroll/resize to close or update position (simple approach: close on scroll)
    useEffect(() => {
        if (!open) return;
        const handleScroll = () => setOpen(false);
        const handleResize = () => setOpen(false);

        window.addEventListener("scroll", handleScroll, { capture: true });
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll, { capture: true });
            window.removeEventListener("resize", handleResize);
        };
    }, [open]);

    const selectedOption = options.find((o) => o.value === value);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={`relative w-full rounded-xl px-3 py-2.5 text-left text-sm border transition-all outline-none bg-muted/30 border-border/50 flex items-center justify-between ${disabled
                    ? "opacity-50 cursor-not-allowed bg-muted/10"
                    : "hover:bg-muted/50 hover:border-border focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    } ${className}`}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span className={`block truncate ${selectedOption ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && coords && createPortal(
                <>
                    {/* Backdrop to close */}
                    <div
                        className="fixed inset-0 z-[9999]"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div
                        className="fixed z-[10000] max-h-60 overflow-auto rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col p-1.5 custom-scrollbar ring-1 ring-border/20"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                        }}
                    >
                        {options.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-muted-foreground text-center italic">
                                No options available
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-sm outline-none transition-colors ${option.value === value
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-muted/80 text-foreground"
                                        }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="absolute right-2.5 flex items-center justify-center text-primary">
                                            <Check size={14} strokeWidth={2.5} />
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
