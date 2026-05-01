import { createContext, useCallback, useContext, useReducer } from 'react'

const DocumentContext = createContext(null)

const initialState = {
  documents: [],
  selectedDocument: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    status: '',
    department: '',
  },
  pagination: { page: 1, limit: 5, total: 0 },
}

function documentReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, documents: action.payload }
    case 'FETCH_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'SELECT_DOCUMENT':
      return { ...state, selectedDocument: action.payload }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload }, pagination: { ...state.pagination, page: 1 } }
    case 'SET_PAGINATION':
      return { ...state, pagination: { ...state.pagination, ...action.payload } }
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] }
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.payload.id ? action.payload : doc
        ),
        selectedDocument: state.selectedDocument?.id === action.payload.id ? action.payload : state.selectedDocument,
      }
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter((doc) => doc.id !== action.payload),
      }
    default:
      return state
  }
}

export function DocumentProvider({ children }) {
  const [state, dispatch] = useReducer(documentReducer, initialState)

  const fetchDocuments = useCallback((docs) => {
    dispatch({ type: 'FETCH_SUCCESS', payload: docs })
  }, [])

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const setPagination = useCallback((pagination) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination })
  }, [])

  const selectDocument = useCallback((document) => {
    dispatch({ type: 'SELECT_DOCUMENT', payload: document })
  }, [])

  const addDocument = useCallback((doc) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: doc })
  }, [])

  const updateDocument = useCallback((doc) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: doc })
  }, [])

  const deleteDocument = useCallback((id) => {
    dispatch({ type: 'DELETE_DOCUMENT', payload: id })
  }, [])

  return (
    <DocumentContext.Provider value={{ ...state, fetchDocuments, setFilters, setPagination, selectDocument, addDocument, updateDocument, deleteDocument }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocuments must be used within a DocumentProvider')
  return context
}
