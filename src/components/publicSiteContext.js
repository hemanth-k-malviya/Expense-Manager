import { createContext, useContext } from 'react'

export const PublicSiteContext = createContext(null)

export function usePublicSite() {
  const value = useContext(PublicSiteContext)
  if (!value) {
    throw new Error('usePublicSite must be used on a public page')
  }
  return value
}
