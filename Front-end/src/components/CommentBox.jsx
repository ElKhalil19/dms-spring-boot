import { useState, useEffect } from 'react'
import { commentsApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function CommentBox({ documentId, currentUser }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [translatedVisibility, setTranslatedVisibility] = useState({})
  const { addToast } = useToast()

  useEffect(() => {
    loadComments()
  }, [documentId])

  async function loadComments() {
    setLoading(true)
    try {
      const commentData = await commentsApi.getByDocument(documentId)
      setComments(commentData)
      setTranslatedVisibility({})
    } catch (err) {
      addToast(err.message || 'Failed to load comments', 'error')
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
    } catch (err) {
      addToast(err.message || 'Failed to add comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleTranslation(commentId) {
    setTranslatedVisibility((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
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
              <p className="comment-text">
                {translatedVisibility[c.id] && c.translatedText ? c.translatedText : c.text}
              </p>
              {c.translatedText && (
                <button className="btn btn-link btn-sm" onClick={() => toggleTranslation(c.id)} type="button">
                  {translatedVisibility[c.id] ? 'Show original' : 'Translate'}
                </button>
              )}
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
