import { useState, useRef, useEffect } from "react";

interface DropdownOption {
    label: string;
    value: string;
}

interface UseDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
    isLoading?: boolean;
}

const useDropdown = ({ options, value, onChange, isDisabled = false, isLoading = false }: UseDropdownProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle selecting an option
    const handleSelect = (selectedValue: any) => {
        onChange(selectedValue);
        toggleDropdown()
    };

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        console.log(!isDisabled && !isLoading)
        if (!isDisabled && !isLoading) {
            setIsExpanded((prev) => !prev);
        }
    };

    const handleExpandation = (action : boolean) => {
        toggleDropdown()
    }
    return {
        isExpanded,
        dropdownRef,
        toggleDropdown,
        handleSelect,
        handleExpandation
    };
};

export default useDropdown;