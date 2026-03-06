import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import ReactJson from 'react-json-view';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';
import 'katex/dist/katex.min.css';
import './MarkdownTheme.css';
import './FileViewer.css';

interface FileViewerProps {
  fileName: string;
  content: string;
  isPreviewMode: boolean;
  onContentChange: (value: string | undefined) => void;
  theme: 'light' | 'dark';
}

const getLanguage = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'jsx': return 'javascript';
    case 'css': return 'css';
    case 'html': return 'html';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'xml': return 'xml';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'sql': return 'sql';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'csv': return 'csv';
    default: return 'plaintext';
  }
};

const FileViewer: React.FC<FileViewerProps> = ({ fileName, content, isPreviewMode, onContentChange, theme }) => {
  const language = useMemo(() => getLanguage(fileName), [fileName]);
  const isJson = language === 'json';
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  const isMarkdown = language === 'markdown';
  
  // Parse JSON for preview
  const jsonContent = useMemo(() => {
    if (!isJson || !isPreviewMode) return null;
    try {
      return JSON.parse(content);
    } catch (e) {
      return { error: 'Invalid JSON', message: (e as Error).message };
    }
  }, [content, isJson, isPreviewMode]);

  // Parse CSV for preview
  const csvContent = useMemo(() => {
    if (!isCsv || !isPreviewMode) return null;
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    return result;
  }, [content, isCsv, isPreviewMode]);

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  if (isPreviewMode) {
    if (isJson) {
      if (jsonContent && jsonContent.error) {
         return (
             <div className="json-container">
                 <div className="error-message">
                     <strong>JSON Parse Error:</strong> {jsonContent.message}
                 </div>
                 <pre>{content}</pre>
             </div>
         );
      }
      return (
        <div className="json-container">
          <ReactJson 
            src={jsonContent} 
            theme={theme === 'dark' ? 'monokai' : 'rjv-default'} 
            displayDataTypes={false}
            style={{ backgroundColor: 'transparent' }} 
            name={false}
          />
        </div>
      );
    }
    
    if (isCsv) {
        if (csvContent?.errors?.length && (!csvContent.data || csvContent.data.length === 0)) {
            return (
                <div className="csv-container">
                    <div className="error-message">
                        <strong>CSV Parse Error:</strong> {csvContent.errors[0].message}
                    </div>
                </div>
            );
        }
        
        const data = csvContent?.data as any[];
        const meta = csvContent?.meta;
        
        if (!data || data.length === 0) {
            return <div className="csv-container">Empty CSV or Parse Error</div>;
        }

        const headers = meta?.fields || Object.keys(data[0] || {});

        return (
            <div className="csv-container">
                <table className="csv-preview-table">
                    <thead>
                        <tr>
                            {headers.map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                {headers.map((h, j) => <td key={j}>{row[h]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (isMarkdown) {
      return (
        <div 
          className={`markdown-body ${theme === 'dark' ? 'dark-mode' : ''}`} 
          style={{ 
            padding: '2rem', 
            height: '100%', 
            width: '100%',
            maxWidth: 'none',
            overflow: 'auto', 
            backgroundColor: theme === 'dark' ? '#0d1117' : '#ffffff',
            boxSizing: 'border-box',
            margin: 0
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={theme === 'dark' ? vscDarkPlus : vs}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className={className}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // Default Code Preview (Read Only Monaco)
    return (
      <div className="file-viewer-container">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme={editorTheme}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            domReadOnly: true,
            readOnlyMessage: { value: 'Preview mode: read-only' }
          }}
        />
      </div>
    );
  }

  // Edit Mode (Source)
  return (
      <div className="file-viewer-container">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme={editorTheme}
          onChange={onContentChange}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            folding: true,
            wordWrap: 'off',
          }}
        />
      </div>
  );
};

export default FileViewer;
