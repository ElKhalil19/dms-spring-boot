import { useState, useEffect } from 'react'
import { commentsApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function CommentBox({ documentId, currentUser }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadComments()
  }, [documentId])

  async function loadComments() {
    setLoading(true)
    try {
      const commentData = await commentsApi.getByDocument(documentId)
      setComments(commentData)
    } catch {
      addToast('Failed to load comments', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    if (!currentUser) {
      addToast('Please sign in to comment', 'error')
      return
    }
    setSubmitting(true)
    try {
      const newComment = await commentsApi.create({
        documentId,
        userId: currentUser.id,
        author: currentUser.name || currentUser.email,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      })
      setComments((prev) => [...prev, newComment])
      setText('')
      addToast('Comment added!', 'success')
    } catch {
      addToast('Failed to add comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="comment-box">
      <h3 className="section-title">Comments ({comments.length})</h3>

      {loading ? (
        <p className="text-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-muted">No comments yet. Be the first!</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-header">
                <strong>{c.author || 'Unknown'}</strong>
                <span className="text-muted comment-date">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {currentUser && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            className="form-control"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      )}
    </div>
  )
}
