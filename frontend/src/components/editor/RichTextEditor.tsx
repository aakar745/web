'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  UnlinkIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Image as ImageIcon,
  Trash,
  MinusCircle,
  PlusCircle,
  Columns as ColumnsIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getApiUrl } from '@/lib/apiClient'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { ColumnLayout, ColumnBlock } from './columns'
import { MediaLibrary } from '@/components/media/MediaLibrary'

// Extended Image extension with custom attributes for alignment
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      display: {
        default: 'inline',
      },
      float: {
        default: 'none',
      },
    }
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<{
    node: any;
    pos: number;
    getPos: () => number;
  } | null>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // No need to disable the default image
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-primary underline'
        }
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your content here...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      ColumnLayout,
      ColumnBlock,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
    onSelectionUpdate: ({ editor }) => {
      // Check if the selection is an image
      const { state } = editor
      const { selection } = state
      const { ranges } = selection
      const from = ranges[0].$from

      const node = from.nodeAfter
      
      if (node?.type.name === 'image') {
        setSelectedImage({
          node,
          pos: from.pos,
          getPos: () => from.pos,
        })
      } else {
        setSelectedImage(null)
      }
    },
    onFocus: ({ editor }) => {
      const { state } = editor
      const { selection } = state
      const { ranges } = selection
      const from = ranges[0].$from

      const node = from.nodeAfter
      
      if (node?.type.name === 'image') {
        setSelectedImage({
          node,
          pos: from.pos,
          getPos: () => from.pos,
        })
      } else {
        setSelectedImage(null)
      }
    },
    onBlur: () => {
      // Keep selected image state to allow interaction with controls
      // setTimeout(() => setSelectedImage(null), 250)
    }
  })

  // Sync outside value to editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const addImage = useCallback(() => {
    if (!imageUrl || !editor) return
    
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
  }, [editor, imageUrl])

  const setLink = useCallback(() => {
    if (!linkUrl || !editor) return
    
    // Check if URL is valid
    try {
      new URL(linkUrl)
      
      // First check if there's selected text
      const { state } = editor
      const { selection } = state
      const { empty } = selection
      
      // If no text is selected, insert the URL as text and make it a link
      if (empty) {
        // Insert the URL as text first, then convert to link
        editor.chain()
          .focus()
          .insertContent(linkUrl)
          .setTextSelection({
            from: selection.from,
            to: selection.from + linkUrl.length,
          })
          .setLink({ href: linkUrl })
          .run()
      } else {
        // Text is selected, just add link to selection
        editor.chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: linkUrl })
          .run()
      }
      
      setLinkUrl('')
    } catch (e) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL including http:// or https://',
        variant: 'destructive',
      })
    }
  }, [editor, linkUrl])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    
    // Validate file is an image
    if (!file.type.includes('image')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      })
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('image', file)
      
      // Add query parameter to indicate this is a blog image
      const queryParams = new URLSearchParams({ type: 'blog' }).toString()
      
      // Get auth token
      const token = localStorage.getItem('token')
      
      // Upload to backend
      const response = await fetch(`${getApiUrl().replace('/api', '')}/api/upload?${queryParams}`, {
        method: 'POST',
        body: formData,
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      const fileUrl = data.fileUrl || data.data?.fileUrl
      
      if (!fileUrl) {
        throw new Error('No file URL returned from server')
      }
      
      editor.chain().focus().setImage({ src: fileUrl }).run()
      
      toast({
        title: 'Image inserted',
        description: 'Your image has been inserted into the editor.',
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your image. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Image control functions
  const deleteImage = useCallback(() => {
    if (!editor || !selectedImage) return
    
    const pos = selectedImage.getPos()
    editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
    setSelectedImage(null)
  }, [editor, selectedImage])

  const alignImageLeft = useCallback(() => {
    if (!editor || !selectedImage) return
    
    editor.chain().focus().updateAttributes('image', { 
      float: 'left',
      display: 'block',
      style: 'float: left; margin-right: 1rem; margin-bottom: 0.5rem;' 
    }).run()
  }, [editor, selectedImage])

  const alignImageCenter = useCallback(() => {
    if (!editor || !selectedImage) return
    
    editor.chain().focus().updateAttributes('image', { 
      float: 'none',
      display: 'block',
      style: 'display: block; margin-left: auto; margin-right: auto;' 
    }).run()
  }, [editor, selectedImage])

  const alignImageRight = useCallback(() => {
    if (!editor || !selectedImage) return
    
    editor.chain().focus().updateAttributes('image', { 
      float: 'right',
      display: 'block',
      style: 'float: right; margin-left: 1rem; margin-bottom: 0.5rem;' 
    }).run()
  }, [editor, selectedImage])

  const increaseImageSize = useCallback(() => {
    if (!editor || !selectedImage) return
    
    const attrs = selectedImage.node.attrs
    const width = attrs.width ? parseInt(attrs.width) : 300
    const newWidth = width + 50
    
    editor.chain().focus().updateAttributes('image', { 
      width: newWidth,
      style: `${attrs.style?.replace(/width:\s*\d+px/, '') || ''}width: ${newWidth}px;` 
    }).run()
  }, [editor, selectedImage])

  const decreaseImageSize = useCallback(() => {
    if (!editor || !selectedImage) return
    
    const attrs = selectedImage.node.attrs
    const width = attrs.width ? parseInt(attrs.width) : 300
    const newWidth = Math.max(50, width - 50)
    
    editor.chain().focus().updateAttributes('image', { 
      width: newWidth,
      style: `${attrs.style?.replace(/width:\s*\d+px/, '') || ''}width: ${newWidth}px;` 
    }).run()
  }, [editor, selectedImage])

  // Add column layout buttons
  const addTwoColumnLayout = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertColumnLayout().run()
  }, [editor])

  const addThreeColumnLayout = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertThreeColumnLayout().run()
  }, [editor])

  const deleteColumnLayout = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteColumnLayout().run()
    
    toast({
      title: 'Column layout deleted',
      description: 'The column layout has been removed.'
    })
  }, [editor])

  const handleMediaSelect = useCallback((media: any) => {
    if (!editor) return
    
    // Make sure the URL is absolute with the correct backend domain
    const baseApiUrl = getApiUrl().replace('/api', '')
    let fullUrl = media.url
    if (media.url.startsWith('/')) {
      fullUrl = `${baseApiUrl}${media.url}`
    }
    
    // Insert the image into the editor
    editor.chain().focus().setImage({ src: fullUrl }).run()
    
    toast({
      title: 'Image inserted',
      description: 'The selected image has been inserted into the editor.',
    })
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        {/* Text formatting */}
        <Toggle
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          size="sm"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          size="sm"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
          size="sm"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
          size="sm"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Code"
          size="sm"
        >
          <Code className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              {editor.isActive('heading', { level: 1 }) ? 'H1' : 
               editor.isActive('heading', { level: 2 }) ? 'H2' : 
               editor.isActive('heading', { level: 3 }) ? 'H3' : 
               editor.isActive('heading', { level: 4 }) ? 'H4' : 
               'Normal'}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('paragraph') ? 'bg-accent' : ''}
            >
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              className={editor.isActive('heading', { level: 4 }) ? 'bg-accent' : ''}
            >
              Heading 4
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Lists */}
        <Toggle
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
          size="sm"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
          size="sm"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
          size="sm"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Text alignment */}
        <Toggle
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Align Left"
          size="sm"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="Align Center"
          size="sm"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="Align Right"
          size="sm"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: 'justify' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
          aria-label="Align Justify"
          size="sm"
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle
              pressed={editor.isActive('link')}
              aria-label="Link"
              size="sm"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium">Insert Link</p>
              <div className="flex space-x-2">
                <Input 
                  placeholder="https://example.com" 
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setLink()
                    }
                  }}
                />
                <Button onClick={setLink} size="sm">Add</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {editor.isActive('link') && (
          <Toggle
            pressed={false}
            onPressedChange={() => editor.chain().focus().unsetLink().run()}
            aria-label="Remove Link"
            size="sm"
          >
            <UnlinkIcon className="h-4 w-4" />
          </Toggle>
        )}
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Image upload and URL */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle
              aria-label="Insert Image"
              size="sm"
            >
              <ImageIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col space-y-4">
              <p className="text-sm font-medium">Insert Image</p>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Upload from your device</p>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Select from Media Library</p>
                <MediaLibrary
                  onSelect={handleMediaSelect}
                  allowedTypes={['image/*']}
                  triggerButton={
                    <Button variant="outline" className="w-full">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select from Media Library
                    </Button>
                  }
                  contextType="blog"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or insert from URL</p>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                  <Button onClick={addImage} size="sm">Add</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Add a new section for layout controls */}
        <div className="w-full mt-2 pt-2 border-t flex items-center">
          <span className="text-xs text-muted-foreground mr-2">Layout:</span>
          
          {/* Column Layout button with improved styling */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1 border-dashed bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-xs"
              >
                <ColumnsIcon className="h-4 w-4 mr-1" />
                Insert Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="flex flex-col space-y-3">
                <div>
                  <p className="text-sm font-medium">Insert Columns</p>
                  <p className="text-xs text-muted-foreground">Add a multi-column layout to organize your content</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-col h-auto py-4 gap-2"
                    onClick={addTwoColumnLayout}
                  >
                    <div className="flex justify-center w-full space-x-1">
                      <div className="w-8 h-12 bg-muted/50 rounded"></div>
                      <div className="w-8 h-12 bg-muted/50 rounded"></div>
                    </div>
                    <span className="text-xs">Two Columns</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-col h-auto py-4 gap-2"
                    onClick={addThreeColumnLayout}
                  >
                    <div className="flex justify-center w-full space-x-1">
                      <div className="w-5 h-12 bg-muted/50 rounded"></div>
                      <div className="w-5 h-12 bg-muted/50 rounded"></div>
                      <div className="w-5 h-12 bg-muted/50 rounded"></div>
                    </div>
                    <span className="text-xs">Three Columns</span>
                  </Button>
                </div>
                
                <div className="text-xs p-2 bg-muted/20 rounded border border-muted">
                  <p className="font-medium">How to use columns:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Each column is a separate content area</li>
                    <li>Click inside a column to add content to it</li>
                    <li>Add text, images, and lists inside each column</li>
                    <li>Use the delete button in the first column to remove the entire layout</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Show image controls when an image is selected */}
        {selectedImage && (
          <>
            <div className="w-px h-6 bg-border mx-1 self-center" />
            
            {/* Image control buttons */}
            <Toggle
              pressed={false}
              onPressedChange={deleteImage}
              aria-label="Delete Image"
              size="sm"
            >
              <Trash className="h-4 w-4" />
            </Toggle>
            
            <Toggle
              pressed={selectedImage.node.attrs.float === 'left'}
              onPressedChange={alignImageLeft}
              aria-label="Align Image Left"
              size="sm"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            
            <Toggle
              pressed={selectedImage.node.attrs.float === 'none' && selectedImage.node.attrs.display === 'block'}
              onPressedChange={alignImageCenter}
              aria-label="Align Image Center"
              size="sm"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            
            <Toggle
              pressed={selectedImage.node.attrs.float === 'right'}
              onPressedChange={alignImageRight}
              aria-label="Align Image Right"
              size="sm"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            
            <Toggle
              pressed={false}
              onPressedChange={decreaseImageSize}
              aria-label="Decrease Image Size"
              size="sm"
            >
              <MinusCircle className="h-4 w-4" />
            </Toggle>
            
            <Toggle
              pressed={false}
              onPressedChange={increaseImageSize}
              aria-label="Increase Image Size"
              size="sm"
            >
              <PlusCircle className="h-4 w-4" />
            </Toggle>
          </>
        )}
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px] focus-visible:outline-none"
        />
        
        {/* Add global CSS for columns and existing image styles */}
        <style jsx global>{`
          .ProseMirror {
            position: relative;
          }
          
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            cursor: pointer;
            border-radius: 0.5rem;
          }
          
          .ProseMirror img.ProseMirror-selectednode {
            outline: 2px solid hsl(var(--primary));
            border-radius: 0.5rem;
          }
          
          /* Column layout styles */
          .column-layout-container {
            margin: 2rem 0;
            min-height: 100px;
            background-color: hsl(var(--muted)/15%);
            display: flex !important;
            flex-direction: row !important;
          }
          
          .column-layout-container > * {
            flex: 1;
            min-width: 0;
          }
          
          .column-layout-container::before {
            content: "Column Layout";
            display: block;
            position: absolute;
            top: -2.5rem;
            left: 0;
            font-size: 0.75rem;
            color: hsl(var(--muted-foreground));
            background: hsl(var(--background));
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem 0.25rem 0 0;
            border: 1px solid hsl(var(--border));
            border-bottom: none;
          }
          
          .column-block-wrapper {
            padding: 0.5rem;
            margin-top: 1.5rem;
            flex: 1;
            min-width: 0;
            width: 100%;
          }
          
          .column-block:hover {
            border-color: hsl(var(--muted-foreground)/40%);
            background-color: hsl(var(--background));
          }
          
          .ProseMirror-focused .column-block:focus-within {
            border-color: hsl(var(--primary));
            border-style: solid;
          }
        `}</style>
      </div>
    </div>
  )
} 