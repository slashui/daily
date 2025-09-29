// Simple markdown parser for basic formatting
export function parseMarkdown(markdown: string): string {
  if (!markdown) return ''

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')

    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="font-bold"><em class="italic">$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')

    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded-md overflow-auto text-sm font-mono my-2"><code>$1</code></pre>')
    .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')

    // Lists
    .replace(/^\* (.+)$/gim, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^\- (.+)$/gim, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^\+ (.+)$/gim, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gim, '<li class="ml-4 mb-1">$1. $2</li>')

    // Line breaks
    .replace(/\n\n/gim, '</p><p class="mb-3">')
    .replace(/\n/gim, '<br>')

  // Wrap in paragraphs if content exists
  if (html.trim()) {
    html = '<div class="prose prose-sm max-w-none"><p class="mb-3">' + html + '</p></div>'
  }

  return html
}