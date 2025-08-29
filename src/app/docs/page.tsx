'use client'

import { useState, useEffect } from 'react'
import { 
  CodeBracketIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  LockClosedIcon,
  CheckIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DocsPage() {
  const [domain, setDomain] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    // Get the current domain in real-time
    setDomain(window.location.origin)
  }, [])

  const copyToClipboard = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const CodeBlock = ({ code, language, codeId }: { code: string; language: string; codeId: string }) => (
    <div className="relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, codeId)}
          className="h-8 px-2 bg-background/80 hover:bg-background border border-border"
        >
          {copiedCode === codeId ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-600 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto border border-border">
        <code className={`text-sm ${language === 'bash' ? 'text-green-600' : 'text-foreground'}`}>
          {code}
        </code>
      </pre>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight">
            API <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Integrate Droply into your applications with our comprehensive API documentation
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16 sm:space-y-20">
            {/* Quick Start */}
            <div className="space-y-8">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CodeBracketIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  🚀 Quick Start
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Get started with Droply API in minutes. Upload, download, and manage files programmatically.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Base URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      Base URL
                    </CardTitle>
                    <CardDescription>
                      All API endpoints are relative to this base URL
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={domain || 'https://your-domain.com'} 
                      language="text" 
                      codeId="base-url" 
                    />
                  </CardContent>
                </Card>

                {/* Authentication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                      Authentication
                    </CardTitle>
                    <CardDescription>
                      Secure your API calls with password protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`// All endpoints support password protection
// Set password when uploading files
// Include password in download requests`} 
                      language="javascript" 
                      codeId="auth" 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Upload Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5 text-blue-600" />
                    Upload a File
                  </CardTitle>
                  <CardDescription>
                    Upload files with custom settings using cURL or your preferred HTTP client
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">cURL Example:</h4>
                    <CodeBlock 
                      code={`curl -X POST "${domain}/api/v1/upload" \\
  -F "file=@/path/to/your/file.pdf" \\
  -F "password=your_password" \\
  -F "expiresIn=7d" \\
  -F "maxDownloads=10"`} 
                      language="bash" 
                      codeId="curl-upload" 
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">JavaScript Example:</h4>
                    <CodeBlock 
                      code={`const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('password', 'your_password');
formData.append('expiresIn', '7d');
formData.append('maxDownloads', '10');

const response = await fetch('${domain}/api/v1/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('File ID:', result.fileId);`} 
                      language="javascript" 
                      codeId="js-upload" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Download Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5 text-green-600" />
                    Download a File
                  </CardTitle>
                  <CardDescription>
                    Download files using the file ID and password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">cURL Example:</h4>
                    <CodeBlock 
                      code={`curl -X POST "${domain}/api/v1/download/FILE_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"password": "your_password"}' \\
  -o downloaded_file.pdf`} 
                      language="bash" 
                      codeId="curl-download" 
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">JavaScript Example:</h4>
                    <CodeBlock 
                      code={`const response = await fetch('${domain}/api/v1/download/FILE_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: 'your_password'
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filename.pdf';
  a.click();
}`} 
                      language="javascript" 
                      codeId="js-download" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CodeBracketIcon className="w-5 h-5 text-purple-600" />
                    API Endpoints
                  </CardTitle>
                  <CardDescription>
                    Complete list of available API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Upload File</h4>
                        <p className="text-sm text-muted-foreground mb-2">POST /api/v1/upload</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClockIcon className="w-3 h-3" />
                          <span>File upload with settings</span>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Download File</h4>
                        <p className="text-sm text-muted-foreground mb-2">POST /api/v1/download/[id]</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <LockClosedIcon className="w-3 h-3" />
                          <span>Password required</span>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">File Info</h4>
                        <p className="text-sm text-muted-foreground mb-2">GET /api/v1/info/[id]</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DocumentTextIcon className="w-3 h-3" />
                          <span>File metadata</span>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Delete File</h4>
                        <p className="text-sm text-muted-foreground mb-2">POST /api/v1/delete/[id]</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <LockClosedIcon className="w-3 h-3" />
                          <span>Password required</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Format */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                    Response Format
                  </CardTitle>
                  <CardDescription>
                    Standard response format for all API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Success Response:</h4>
                      <CodeBlock 
                        code={`{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "abc123def456",
    "originalName": "document.pdf",
    "size": 1024000,
    "expiresAt": "2024-02-15T00:00:00Z",
    "maxDownloads": 10,
    "downloadUrl": "${domain}/download/abc123def456"
  }
}`} 
                        language="json" 
                        codeId="success-response" 
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Error Response:</h4>
                      <CodeBlock 
                        code={`{
  "success": false,
  "error": "Invalid password",
  "message": "The provided password is incorrect",
  "code": "INVALID_PASSWORD"
}`} 
                        language="json" 
                        codeId="error-response" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                    Rate Limiting
                  </CardTitle>
                  <CardDescription>
                    API usage limits and restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground">30</div>
                        <div className="text-sm text-muted-foreground">Requests per minute</div>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground">100 MB</div>
                        <div className="text-sm text-muted-foreground">Max file size</div>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground">24h</div>
                        <div className="text-sm text-muted-foreground">Max expiry time</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-700 dark:via-indigo-700 dark:to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Integrate?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Start building with Droply API today. Need help? Check out our examples or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button 
              asChild
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <a href="/upload">
                Try API Now
              </a>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white transition-all duration-200"
            >
              <a href="/help">
                Get Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
