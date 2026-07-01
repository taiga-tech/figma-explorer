export const formatHrefPathname = (href: string) => {
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}
