import { APP_NAME } from './constants'
import { SITE_URL } from './site'

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined') return
  let node = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!content) {
    node?.remove()
    return
  }
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attr, key)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (typeof document === 'undefined') return
  let node = document.head.querySelector(`link[rel="${rel}"]`)
  if (!href) {
    node?.remove()
    return
  }
  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', rel)
    document.head.appendChild(node)
  }
  node.setAttribute('href', href)
}

export function setPageMeta({ title, description, path = '/', noindex = false }) {
  const pageTitle = title.includes(APP_NAME) ? title : `${title} — ${APP_NAME}`
  document.title = pageTitle
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
  upsertMeta('property', 'og:title', pageTitle)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', `${SITE_URL}${path}`)
  upsertMeta('property', 'og:type', 'website')
  upsertLink('canonical', `${SITE_URL}${path}`)
}
