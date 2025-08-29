'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  generateFileExtension, 
  parseFileExtension, 
  generateSmartFilename,
  getSupportedExtensions,
  type CompressionAlgo,
  type ArchiveAlgo
} from '@/lib/utils/file-extensions'

export default function FileExtensionDemo() {
  const [baseName, setBaseName] = useState('document')
  const [selectedArchive, setSelectedArchive] = useState<ArchiveAlgo | 'none'>('none')
  const [selectedCompression, setSelectedCompression] = useState<CompressionAlgo | 'none'>('none')
  const [timestamp, setTimestamp] = useState(false)
  const [customFilename, setCustomFilename] = useState('')
  const [parsedResult, setParsedResult] = useState<any>(null)

  const generateFilename = () => {
    try {
      const result = generateFileExtension({
        archive: selectedArchive,
        compression: selectedCompression,
        baseName
      })
      
      const smartFilename = generateSmartFilename(baseName, {
        archive: selectedArchive,
        compression: selectedCompression,
        timestamp
      })
      
      setCustomFilename(smartFilename)
    } catch (error) {
      console.error('Error generating filename:', error)
    }
  }

  const parseFilename = () => {
    if (!customFilename) return
    
    try {
      const result = parseFileExtension(customFilename)
      setParsedResult(result)
    } catch (error) {
      console.error('Error parsing filename:', error)
      setParsedResult(null)
    }
  }

  const supportedExtensions = getSupportedExtensions()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🔥 File Extension Naming Convention</h1>
        <p className="text-muted-foreground">
          Generate and parse file extensions based on archive type and compression algorithm
        </p>
      </div>

      {/* Naming Convention Table */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Supported File Extension Patterns</CardTitle>
          <CardDescription>
            The complete naming convention for different archive and compression combinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Archive</th>
                  <th className="border border-border p-2 text-left">Algo</th>
                  <th className="border border-border p-2 text-left">Output Extension</th>
                  <th className="border border-border p-2 text-left">Example</th>
                  <th className="border border-border p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {supportedExtensions.map((ext, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="border border-border p-2">
                      <Badge variant={ext.archive === 'none' ? 'secondary' : 'default'}>
                        {ext.archive}
                      </Badge>
                    </td>
                    <td className="border border-border p-2">
                      <Badge variant={ext.compression === 'none' ? 'secondary' : 'outline'}>
                        {ext.compression}
                      </Badge>
                    </td>
                    <td className="border border-border p-2 font-mono">{ext.extension}</td>
                    <td className="border border-border p-2 font-mono">{ext.example}</td>
                    <td className="border border-border p-2 text-sm">{ext.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filename Generator */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Filename Generator</CardTitle>
          <CardDescription>
            Generate filenames with proper extensions based on your settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseName">Base Filename</Label>
              <Input
                id="baseName"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                placeholder="Enter base filename"
              />
            </div>
            <div>
              <Label htmlFor="archive">Archive Type</Label>
              <Select value={selectedArchive} onValueChange={(value: any) => setSelectedArchive(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Single file)</SelectItem>
                  <SelectItem value="zip">ZIP</SelectItem>
                  <SelectItem value="tar">TAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="compression">Compression Algorithm</Label>
              <Select value={selectedCompression} onValueChange={(value: any) => setSelectedCompression(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="gzip">GZIP</SelectItem>
                  <SelectItem value="brotli">Brotli</SelectItem>
                  <SelectItem value="zip">ZIP (deflate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="timestamp"
                checked={timestamp}
                onChange={(e) => setTimestamp(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="timestamp">Add timestamp</Label>
            </div>
          </div>
          
          <Button onClick={generateFilename} className="w-full">
            Generate Filename
          </Button>
          
          {customFilename && (
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Generated Filename:</Label>
              <div className="font-mono text-lg mt-2 break-all">{customFilename}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filename Parser */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Filename Parser</CardTitle>
          <CardDescription>
            Parse existing filenames to understand their archive and compression settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customFilename">Filename to Parse</Label>
            <Input
              id="customFilename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Enter filename to parse (e.g., document.tar.gz)"
            />
          </div>
          
          <Button onClick={parseFilename} className="w-full">
            Parse Filename
          </Button>
          
          {parsedResult && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label className="text-sm font-medium">Parsed Result:</Label>
              <div className="space-y-1 text-sm">
                <div><strong>Base Name:</strong> {parsedResult.baseName}</div>
                <div><strong>Archive:</strong> <Badge variant="outline">{parsedResult.archive}</Badge></div>
                <div><strong>Compression:</strong> <Badge variant="outline">{parsedResult.compression}</Badge></div>
                <div><strong>Description:</strong> {parsedResult.description}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Examples</CardTitle>
          <CardDescription>
            Common use cases and their resulting filenames
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Single File Compression</h4>
              <div className="text-sm space-y-1">
                <div>• <code>document.txt</code> + GZIP = <code>document.txt.gz</code></div>
                <div>• <code>image.svg</code> + Brotli = <code>image.svg.br</code></div>
                <div>• <code>data.json</code> + ZIP = <code>data.json.zip</code></div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Archive Compression</h4>
              <div className="text-sm space-y-1">
                <div>• Multiple files + ZIP = <code>bundle.zip</code></div>
                <div>• Multiple files + TAR + GZIP = <code>bundle.tar.gz</code></div>
                <div>• Multiple files + TAR + Brotli = <code>bundle.tar.br</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
