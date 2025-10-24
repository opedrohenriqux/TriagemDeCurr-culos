import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    const renderPageNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 3;
        const half = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > half + 2) {
                pageNumbers.push('...');
            }

            let start = Math.max(2, currentPage - half);
            let end = Math.min(totalPages - 1, currentPage + half);

            if (currentPage <= half + 1) {
                end = 2 + maxPagesToShow -1;
            }

            if (currentPage >= totalPages - half) {
                start = totalPages - maxPagesToShow;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - half - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers.map((number, index) => {
            if (number === '...') {
                return <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm font-semibold">...</span>;
            }
            return (
                <button
                    key={number}
                    onClick={() => onPageChange(number as number)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                        currentPage === number
                            ? 'bg-light-primary dark:bg-primary text-white border border-light-primary dark:border-primary'
                            : 'bg-light-surface dark:bg-surface border border-light-border dark:border-border hover:bg-light-background dark:hover:bg-background'
                    }`}
                >
                    {number}
                </button>
            );
        });
    };


    return (
        <div className="flex items-center justify-center space-x-1 py-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-semibold rounded-md bg-light-surface dark:bg-surface border border-light-border dark:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Anterior
            </button>

            {renderPageNumbers()}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-semibold rounded-md bg-light-surface dark:bg-surface border border-light-border dark:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Próximo
            </button>
        </div>
    );
};

export default Pagination;
