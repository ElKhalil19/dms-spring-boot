export default function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div className="pagination">
      <button
        className="btn btn-ghost pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={`btn pagination-btn ${currentPage === page ? 'pagination-active' : 'btn-ghost'}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="btn btn-ghost pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next →
      </button>

      <span className="pagination-info">
        Page {currentPage} of {totalPages} ({totalItems} items)
      </span>
    </div>
  )
}
