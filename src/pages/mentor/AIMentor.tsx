import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Copy,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ChatMessage } from '../../types';

const AIMentor = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageType, setMessageType] = useState<'question' | 'code_review' | 'explanation' | 'debugging'>('question');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/ai-mentor/chat/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() && !codeSnippet.trim()) {
      toast.error('Please enter a message or code snippet');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentMessage,
          message_type: messageType,
          code_snippet: codeSnippet || undefined,
          programming_language: codeSnippet ? programmingLanguage : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
        setCurrentMessage('');
        setCodeSnippet('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const rateMessage = async (messageId: string, rating: number) => {
    try {
      const response = await fetch(`/api/ai-mentor/chat/${messageId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, rating } : msg
        ));
        toast.success('Rating submitted');
      }
    } catch (error) {
      console.error('Error rating message:', error);
      toast.error('Failed to submit rating');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      try {
        const response = await fetch('/api/ai-mentor/chat/clear', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setMessages([]);
          toast.success('Chat history cleared');
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
        toast.error('Failed to clear chat');
      }
    }
  };

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    setCurrentMessage(textarea.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'code_review': return <Code className="h-4 w-4" />;
      case 'debugging': return <RefreshCw className="h-4 w-4" />;
      case 'explanation': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'code_review': return 'bg-blue-100 text-blue-800';
      case 'debugging': return 'bg-red-100 text-red-800';
      case 'explanation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Mentor</h1>
              <p className="text-sm text-gray-600">Get instant help with coding questions and reviews</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AI Mentor!</h3>
            <p className="text-gray-600 mb-4">
              Ask me anything about programming, request code reviews, or get explanations for complex concepts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">💡 Ask Questions</h4>
                <p className="text-sm text-gray-600">Get help with programming concepts, best practices, and problem-solving</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🔍 Code Review</h4>
                <p className="text-sm text-gray-600">Submit your code for detailed feedback and improvement suggestions</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🐛 Debug Help</h4>
                <p className="text-sm text-gray-600">Get assistance with troubleshooting and fixing code issues</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📚 Explanations</h4>
                <p className="text-sm text-gray-600">Understand complex topics with clear, detailed explanations</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {/* User Message */}
              <div className="flex items-start space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">You</span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.message_type)}`}>
                      {getMessageTypeIcon(message.message_type)}
                      <span>{message.message_type.replace('_', ' ')}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                    {message.code_snippet && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">
                            {message.programming_language}
                          </span>
                          <button
                            onClick={() => copyToClipboard(message.code_snippet!)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                          <code>{message.code_snippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Bot className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">AI Mentor</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(message.response)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => rateMessage(message.id, 1)}
                          className={`p-1 rounded ${message.rating === 1 ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => rateMessage(message.id, -1)}
                          className={`p-1 rounded ${message.rating === -1 ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-900">
                        {message.response}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="space-y-4">
          {/* Message Type Selector */}
          <div className="flex space-x-2">
            {[
              { value: 'question', label: 'Question', icon: MessageSquare },
              { value: 'code_review', label: 'Code Review', icon: Code },
              { value: 'debugging', label: 'Debug Help', icon: RefreshCw },
              { value: 'explanation', label: 'Explanation', icon: MessageSquare }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMessageType(value as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  messageType === value
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Code Snippet Input */}
          {(messageType === 'code_review' || messageType === 'debugging') && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Programming Language:</label>
                <select
                  value={programmingLanguage}
                  onChange={(e) => setProgrammingLanguage(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste your code here..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={6}
              />
            </div>
          )}

          {/* Message Input */}
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={handleTextareaResize}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about programming..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || (!currentMessage.trim() && !codeSnippet.trim())}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentor;