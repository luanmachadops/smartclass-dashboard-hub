
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePoll: (pollData: { question: string; options: string[] }) => void
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreatePoll
}) => {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.trim())
    
    if (!question.trim()) {
      alert('Por favor, insira uma pergunta')
      return
    }
    
    if (validOptions.length < 2) {
      alert('Por favor, insira pelo menos 2 opções')
      return
    }

    onCreatePoll({
      question: question.trim(),
      options: validOptions
    })

    // Reset form
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Enquete</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Pergunta</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Opções</Label>
            <div className="space-y-2 mt-1">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Criar Enquete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
