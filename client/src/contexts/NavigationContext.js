import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export function NavigationProvider({ children }) {
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(location.pathname);
    const [pageTitle, setPageTitle] = useState('');
    const previousPageRef = useRef(null);

    useEffect(() => {
        // Cuvamo prethodnu stranicu pre azuriranja trenutne
        previousPageRef.current = currentPage;
        setCurrentPage(location.pathname);
    }, [location.pathname]);

    const isOnPage = (path) => currentPage === path;
    const isOnPageGroup = (pathPattern) => currentPage.startsWith(pathPattern);
    const isPreviousPage = (path) => previousPageRef.current === path;
    const isPreviousPageGroup = (pathPattern) => previousPageRef.current?.startsWith(pathPattern);
    
    const navigate = (path, title = '') => {
        setCurrentPage(path);
        if (title) setPageTitle(title);
    };

    const value = {
        currentPage,
        pageTitle,
        previousPage: previousPageRef.current,
        setCurrentPage,
        setPageTitle,
        isOnPage,
        isOnPageGroup,
        isPreviousPage,
        isPreviousPageGroup,
        navigate
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}