'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Table } from '@/components/common/Table';
import { 
  RiUploadLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiMoreLine,
  RiFilterLine,
  RiGridLine,
  RiListCheck,
  RiSortAsc,
  RiSortDesc,
  RiSearchLine,
  RiDragDropLine,
  RiFolderLine,
  RiFileLine,
  RiFilePdfLine,
  RiVideoLine,
  RiImageLine,
  RiFileZipLine,
  RiFileTextLine
} from '@remixicon/react';
import FileUpload from '@/components/FileUpload';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  fileType: string;
  size: string;
  uploadedAt: string;
  modifiedAt: string;
  status: 'pinned' | 'stored' | 'error';
  ipfsHash: string;
  downloads: number;
  isSelected: boolean;
}

interface FileBrowserClientProps {
  files: FileItem[];
  deleteFileAction: (fileId: string) => Promise<{ success: boolean; error?: string }>;
  downloadFileAction: (fileId: string) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>;
}

export default function FileBrowserClient({ 
  files: initialFiles, 
  deleteFileAction, 
  downloadFileAction
}: FileBrowserClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // File icon mapping
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'folder':
        return RiFolderLine;
      case 'pdf':
        return RiFilePdfLine;
      case 'mp4':
      case 'avi':
      case 'mov':
        return RiVideoLine;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return RiImageLine;
      case 'zip':
      case 'rar':
        return RiFileZipLine;
      case 'txt':
      case 'doc':
      case 'docx':
        return RiFileTextLine;
      default:
        return RiFileLine;
    }
  };

  // Filter files based on search query
  const filteredFiles = initialFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        // Extract number from size string for sorting
        const aSize = parseFloat(a.size);
        const bSize = parseFloat(b.size);
        comparison = aSize - bSize;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(sortedFiles.map(f => f.id));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setShowUploadModal(true);
  };

  const handleDownload = async (fileId: string) => {
    const result = await downloadFileAction(fileId);
    if (result.success && result.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    } else {
      alert(result.error || 'Failed to download file');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file from IPFS?')) {
      return;
    }
    
    const result = await deleteFileAction(fileId);
    if (result.success) {
      // Remove from selection if it was selected
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
      // Page will automatically refresh due to revalidation
    } else {
      alert(result.error || 'Failed to delete file');
    }
  };

  const handleUploadSuccess = () => {
    // Page will automatically refresh due to revalidation
    // Don't close modal - let user decide when to close
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Home</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-medium">Files</span>
        </div>
      </Card>

      {/* Drag and Drop Upload Area */}
      <div 
        className={`mb-6 ${isDragOver ? 'block' : 'hidden'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Card className="border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 p-8">
          <div className="text-center">
            <RiDragDropLine className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Drop files here to upload to IPFS
            </h3>
            <p className="text-blue-600 dark:text-blue-400">
              Release to start uploading your files
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1 min-w-0 relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RiFilterLine className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <RiUploadLine className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="neutral">
                  {selectedFiles.length} selected
                </Badge>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
            
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none border-0"
              >
                <RiListCheck className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none border-0"
              >
                <RiGridLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* File List/Grid */}
      <Card 
        className="p-6" 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            IPFS Files ({sortedFiles.length})
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAllFiles}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <RiSortAsc className="h-4 w-4" /> : <RiSortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {sortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <RiUploadLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No files found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'No files match your search.' : 'Upload your first file to IPFS to get started.'}
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <RiUploadLine className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <Table>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    onChange={selectedFiles.length === sortedFiles.length ? clearSelection : selectAllFiles}
                    checked={selectedFiles.length === sortedFiles.length && sortedFiles.length > 0}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Size
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Uploaded
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file) => {
                const FileIcon = getFileIcon(file.fileType);
                return (
                  <tr 
                    key={file.id} 
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedFiles.includes(file.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <FileIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {file.ipfsHash.slice(0, 20)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                      {file.size}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={file.status === 'pinned' ? 'success' : file.status === 'error' ? 'destructive' : 'neutral'}>
                        {file.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {file.uploadedAt}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.id)}
                          title="Download file"
                        >
                          <RiDownloadLine className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          title="Delete file"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedFiles.map((file) => {
              const FileIcon = getFileIcon(file.fileType);
              return (
                <div
                  key={file.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${selectedFiles.includes(file.id) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-lg mb-3 bg-gray-100 dark:bg-gray-800">
                      <FileIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate w-full">
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {file.size}
                    </p>
                    <Badge size="sm" variant={file.status === 'pinned' ? 'success' : 'neutral'} className="mt-2">
                      {file.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <FileUpload
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}