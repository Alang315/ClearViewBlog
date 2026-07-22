const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            pageNumber === page
              ? "bg-[#b7cf62] text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
