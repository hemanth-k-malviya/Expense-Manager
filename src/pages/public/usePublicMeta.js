import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setPageMeta } from '../../lib/pageMeta'

export function usePublicMeta({ title, description, noindex = false }) {
  const { pathname } = useLocation()

  useEffect(() => {
    setPageMeta({ title, description, path: pathname, noindex })
  }, [description, noindex, pathname, title])
}
