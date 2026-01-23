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
                top: rect.bottom + window.scrollY + 4, // 4px gap
                left: rect.left + window.scrollX,
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
                className={`relative w-full rounded-lg px-3 py-2 text-left text-sm border transition-all outline-none focus:ring-2 focus:ring-primary/20 bg-background border-border flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"
                    } ${className}`}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
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
                        className="fixed z-[10000] max-h-60 overflow-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1 custom-scrollbar"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                        }}
                    >
                        {options.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                                No options
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
                                    className={`relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${option.value === value ? "bg-accent text-accent-foreground font-medium" : ""
                                        }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <Check size={14} />
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </  >,
                document.body
            )}
        </>
    );
}
