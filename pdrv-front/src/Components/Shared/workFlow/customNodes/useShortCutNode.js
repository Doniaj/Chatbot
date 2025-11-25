import { useEffect } from 'react';

export const useShortCutNode = (e, callback) => {
    const handleKeyDown = (event) => {
        if ((event.ctrlKey && event.key === 'd' && e === "duplicate") ||
            (event.ctrlKey && event.key === 'o' && e === "changeToMain") ||
            (event.ctrlKey && event.key === 'b' && e === "changeToDefault") ||
            (event.ctrlKey && event.key === 'i' && e === "changeToInput") ||
            (event.key === 'Delete' && e === "delete")
        ) {
            event.preventDefault();
            callback();
        }
    };
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [callback]);
};