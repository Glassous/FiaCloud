import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CustomPreviewRegistration } from './types'
import './MarkdownPreview.css'

function MarkdownPreviewComponent({ content }: { content: string }) {
  if (!content) {
    return <div className="markdown-preview__empty">文件内容为空</div>
  }

  return (
    <div className="markdown-preview">
      <div className="markdown-preview__content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export const MarkdownPreview: CustomPreviewRegistration = {
  id: 'markdown',
  extensions: ['md', 'markdown'],
  PreviewComponent: (props) => {
    if (props.isEditing) return null
    return <MarkdownPreviewComponent content={props.content} />
  },
  handlesEdit: false,
}
