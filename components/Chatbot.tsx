import React, { useState, useEffect, useRef, useContext } from 'react';
import { Type, FunctionDeclaration, Content } from '@google/genai';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<Content[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { products, addSale, apiRequest } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryProductsFunc: FunctionDeclaration = {
    name: 'queryProducts',
    description: 'Search for products by name, category, or barcode. Returns a list of matching products with their ID, name, price, and stock.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search query (e.g., product name, category, or barcode)'
        }
      },
      required: ['query']
    }
  };

  const makeSaleFunc: FunctionDeclaration = {
    name: 'makeSale',
    description: 'Create a new sale. You must provide the product IDs, quantities, and the payment method.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          description: 'List of items to sell',
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              quantity: { type: Type.NUMBER }
            },
            required: ['productId', 'quantity']
          }
        },
        paymentMethod: {
          type: Type.STRING,
          description: 'Payment method: Cash, Card, or Online',
          enum: ['Cash', 'Card', 'Online']
        }
      },
      required: ['items', 'paymentMethod']
    }
  };

  const systemInstruction = `You are a helpful sales and product assistant for the OnlineAll Kiosk System. 
Your role is to help the user (who is an employee) find products and process sales.
You can query products to check prices and stock.
You can also make sales on behalf of the user.
Always be concise and professional.
When making a sale, ensure you have the correct product IDs and ask for the payment method if not provided.`;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    const userContent: Content = { role: 'user', parts: [{ text: userMsg }] };
    const newHistory = [...history, userContent];
    setHistory(newHistory);
    setIsLoading(true);

    let currentHistory = [...newHistory];

    try {
      let response = await apiRequest<any>(`${((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:3001/api'}/chat/generate`, 'POST', {
        contents: currentHistory,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [queryProductsFunc, makeSaleFunc] }],
        }
      });

      if (response.candidates?.[0]?.content) {
        currentHistory.push(response.candidates[0].content);
      }

      while (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        let functionResult: any = {};
        
        if (call.name === 'queryProducts') {
          const args = call.args as any;
          const query = (args.query || '').toLowerCase();
          const matched = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.categoryId.toLowerCase().includes(query) ||
            p.barcode.toLowerCase().includes(query)
          ).map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }));
          
          functionResult = { products: matched };
        } else if (call.name === 'makeSale') {
          const args = call.args as any;
          const items = args.items;
          const paymentMethod = args.paymentMethod;
          
          try {
            const saleItems = items.map((item: any) => {
              const product = products.find(p => p.id === item.productId);
              if (!product) throw new Error(`Product not found: ${item.productId}`);
              if (product.stock < item.quantity) throw new Error(`Not enough stock for ${product.name}`);
              return {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
              };
            });
            
            await addSale({
              sellerId: currentUser?.id,
              items: saleItems,
            }, paymentMethod);
            
            functionResult = { success: true, message: 'Sale completed successfully.' };
          } catch (e: any) {
            functionResult = { success: false, error: e.message };
          }
        }
        
        const functionResponseContent: Content = {
          role: 'user',
          parts: [{
            functionResponse: {
              name: call.name,
              response: functionResult
            }
          }]
        };
        
        currentHistory.push(functionResponseContent);
        
        response = await apiRequest<any>(`${((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:3001/api'}/chat/generate`, 'POST', {
          contents: currentHistory,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [queryProductsFunc, makeSaleFunc] }],
          }
        });
        
        if (response.candidates?.[0]?.content) {
          currentHistory.push(response.candidates[0].content);
        }
      }
      
      setHistory(currentHistory);
    } catch (error) {
      console.error("Chat error:", error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: t('aiError') }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl hover:shadow-primary-600/30 transition-all z-50 flex items-center justify-center"
        aria-label={t('toggleAIAssistant')}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-primary-600 text-white flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">{t('aiAssistant')}</h3>
              <p className="text-xs text-primary-100">{t('salesAndProducts')}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {history.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('aiWelcome')}</p>
                <p className="text-sm mt-2">{t('aiSuggestion')}</p>
              </div>
            )}
            
            {history.map((msg, index) => {
              // Only display text parts, skip function calls/responses in the UI
              const textPart = msg.parts?.find(p => p.text);
              if (!textPart?.text) return null;

              const isUser = msg.role === 'user';
              
              return (
                <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isUser ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm text-slate-800 dark:text-slate-200'}`}>
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{textPart.text}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span className="text-sm text-slate-500">{t('thinking')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('askAboutProducts')}
                className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 rounded-xl text-sm transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
