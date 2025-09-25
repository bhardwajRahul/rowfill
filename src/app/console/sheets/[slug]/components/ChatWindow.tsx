"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PiPaperPlaneRight } from "react-icons/pi"

export function ChatWindow() {

    const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([])
    const [input, setInput] = useState("")


    return (
        <div className="flex flex-col h-full">
            <div className="h-[calc(100vh-60px)] overflow-y-auto">
                {messages.map((message, index) => (
                    <div key={index}>{message.content}</div>
                ))}
            </div>
            <div className="h-[150px] flex justify-between items-end border-t border-gray-200 p-2">
                <textarea
                    placeholder="Type your message here..."
                    className="w-full h-[130px] outline-none border-none resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <Button onClick={() => setMessages([...messages, { role: "user", content: input }])}>
                    <PiPaperPlaneRight />
                </Button>
            </div>
        </div>
    )
}