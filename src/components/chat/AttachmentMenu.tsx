
import React, { useRef } from 'react'
import { Camera, FileText, Mic, BarChart3 } from 'lucide-react'
import { AttachmentType } from '@/types/chat'

interface AttachmentMenuProps {
  onSelectPoll: () => void
  onFileAttached: (file: File, type: AttachmentType) => void
  onClose: () => void
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelectPoll,
  onFileAttached,
  onClose
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const attachments = [
    {
      name: 'Imagem',
      icon: Camera,
      type: 'image' as AttachmentType,
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-300',
      ref: imageInputRef,
      accept: 'image/*',
      multiple: false
    },
    {
      name: 'Documento',
      icon: FileText,
      type: 'document' as AttachmentType,
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-300',
      ref: documentInputRef,
      accept: '*/*',
      multiple: false
    },
    {
      name: 'Áudio',
      icon: Mic,
      type: 'audio' as AttachmentType,
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      iconColor: 'text-orange-600 dark:text-orange-300',
      ref: audioInputRef,
      accept: 'audio/*',
      multiple: false
    },
    {
      name: 'Enquete',
      icon: BarChart3,
      type: 'poll' as AttachmentType,
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-300'
    }
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
    if (event.target.files && event.target.files[0]) {
      onFileAttached(event.target.files[0], type)
    }
    event.target.value = ''
    onClose()
  }

  const handleButtonClick = (attachment: typeof attachments[0]) => {
    if (attachment.ref && attachment.ref.current) {
      attachment.ref.current.click()
    } else if (attachment.type === 'poll') {
      onSelectPoll()
    }
  }

  return (
    <div className="absolute bottom-full left-0 mb-3 w-full sm:w-auto bg-card rounded-2xl shadow-lg border p-4 z-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {attachments.map(attachment => {
          const Icon = attachment.icon
          return (
            <div key={attachment.type}>
              <button
                onClick={() => handleButtonClick(attachment)}
                className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-muted transition-colors w-full"
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${attachment.bgColor}`}>
                  <Icon className={`h-6 w-6 ${attachment.iconColor}`} />
                </div>
                <span className="mt-2 text-xs font-medium text-foreground">
                  {attachment.name}
                </span>
              </button>
              {attachment.ref && (
                <input
                  type="file"
                  ref={attachment.ref}
                  className="hidden"
                  accept={attachment.accept}
                  multiple={attachment.multiple}
                  onChange={(e) => handleFileChange(e, attachment.type)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
