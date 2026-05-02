/**
 * PageTitleContext.jsx — Lets each page set its own top-bar title + optional extras
 */
import { createContext, useContext, useState, useEffect } from 'react'

const PageTitleContext = createContext(null)

export function PageTitleProvider({ children }) {
  const [title,  setTitle]  = useState('')
  const [extras, setExtras] = useState(null) // JSX node to render in top-bar right area
  return (
    <PageTitleContext.Provider value={{ title, setTitle, extras, setExtras }}>
      {children}
    </PageTitleContext.Provider>
  )
}

/** Call in each page to set the top-bar title. Cleans up extras on unmount. */
export function usePageTitle(pageTitle, extrasNode = null) {
  const ctx = useContext(PageTitleContext)
  if (!ctx) throw new Error('usePageTitle must be inside PageTitleProvider')

  useEffect(() => {
    ctx.setTitle(pageTitle)
    ctx.setExtras(extrasNode)
    return () => { ctx.setExtras(null) }
  }, [pageTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Return setter for dynamic extras updates
  return ctx.setExtras
}

export function usePageTitleValue() {
  const ctx = useContext(PageTitleContext)
  if (!ctx) throw new Error('usePageTitleValue must be inside PageTitleProvider')
  return ctx
}
