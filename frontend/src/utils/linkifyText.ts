export function linkifyText(text: string): string {
  // Decode &#x2F; back to / for URL detection, then re-encode non-URL slashes
  const decoded = text.replace(/&#x2F;/g, '/')
  return decoded.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#6C2EDB;text-decoration:underline">$1</a>'
  )
}
