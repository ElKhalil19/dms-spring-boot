import Navbar from './Navbar'
import Toast from './Toast'

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Toast />
    </div>
  )
}
