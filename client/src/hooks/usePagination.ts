import { useState, useCallback } from 'react';

const usePagination = (totalItems: number, itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    handlePrevPage,
    handleNextPage,
  };
};

export default usePagination;
