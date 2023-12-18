'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import {
  appendMessage,
  checkRunStatus,
  createRun,
  createThread,
  fetchAssistant,
  loadMessages
} from '@/lib/utils/assistant'
import { CustomMessage } from '@/lib/types'
import { EmptyScreen } from './empty-screen'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const { input, setInput } = useChat({
    initialMessages,
    id,
    body: {
      id,
      previewToken: ''
    },
    onResponse(response) {
      appendResult()
      if (response.status === 401) {
        toast.error(response.statusText)
      }
    }
  })

  const appendResult = async () => {
    console.log('appenind the result')
    await appendMessage({ role: 'assistant', content: input })
  }
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assistant_id, setAssistant_id] = useState('')
  const [messages, setMessages] = useState<CustomMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const assistantId = localStorage.getItem('the_assistant_id')
  const thread = localStorage.getItem('the_assistant_thread')

  const handleSave = async () => {
    assistant_id && (await fetchAssistant(assistant_id))
    setIsDialogOpen(false)
  }

  const fetchMessages = async () => {
    const newMessages = await loadMessages()
    setMessages(() => newMessages)
  }

  const onFormSubmit = async (stuff: CustomMessage) => {
    if (isLoading) return

    setIsLoading(true)
    setMessages(prev => [...prev, stuff])
    await appendMessage({ role: stuff.role, content: stuff.content })
    const run_id = await createRun()
    if (run_id) {
      await checkRunStatus(run_id)
      await fetchMessages()
    }
    setIsLoading(false)
  }

  const onNewConversation = async () => {
    await createThread()
    setMessages([])
  }

  useEffect(() => {
    fetchMessages()
    setIsDialogOpen(Boolean(!assistantId))
  }, [])

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        append={onFormSubmit as any}
        input={input}
        setInput={setInput}
        onNewConversation={onNewConversation}
      />
      {/* TODO: open the mmodal when there is no api key */}
      <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
              asst_3Jol7xISnUlSRV1sFe5NFnuL ---
            </DialogDescription>
          </DialogHeader>

          <Input
            value={assistant_id}
            placeholder="OpenAI assistant id"
            onChange={e => setAssistant_id(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button
              onClick={() => {
                handleSave()
                // loadMessages()
              }}
            >
              Save Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
