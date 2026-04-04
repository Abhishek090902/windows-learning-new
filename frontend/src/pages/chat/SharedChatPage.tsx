import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LearnerLayout from '@/components/LearnerLayout';
import MentorLayout from '@/components/MentorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useChatConversations, useMessages, useSendMessage } from '@/hooks/useApi';
import { appRoutes, getChatRoute } from '@/lib/appRoutes';
import { Send, User, MessageCircle, Search, Phone, Video, CheckCheck, ArrowLeft } from 'lucide-react';

type Conversation = {
  otherUserId: string;
  otherName: string;
  otherRole?: string | null;
  lastMessage: string | null;
  lastMessageAt: string | Date;
  otherProfilePicture?: string | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string | Date;
};

const SharedChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const Layout = user?.role === 'MENTOR' ? MentorLayout : LearnerLayout;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useChatConversations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(userId || null);
  const [draft, setDraft] = useState('');

  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeOtherUserId || '');
  const sendMessage = useSendMessage();

  const typedConversations = conversations as unknown as Conversation[];
  const typedMessages = useMemo(() => messages as unknown as ChatMessage[], [messages]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return typedConversations;
    const search = searchQuery.toLowerCase();
    return typedConversations.filter(
      (conversation) =>
        conversation.otherName.toLowerCase().includes(search) ||
        (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(search)),
    );
  }, [typedConversations, searchQuery]);

  useEffect(() => {
    if (userId) {
      setActiveOtherUserId(userId);
      return;
    }

    if (!activeOtherUserId && filteredConversations.length > 0) {
      const nextUserId = filteredConversations[0].otherUserId;
      setActiveOtherUserId(nextUserId);
      navigate(getChatRoute(nextUserId), { replace: true });
    }
  }, [activeOtherUserId, filteredConversations, navigate, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typedMessages]);

  const activeConversation = filteredConversations.find((conversation) => conversation.otherUserId === activeOtherUserId);
  const showConversationList = !activeOtherUserId;
  const showConversationPane = Boolean(activeOtherUserId);

  const formatTime = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffInHours < 48) {
      return 'Yesterday';
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSelectConversation = (otherUserId: string) => {
    setActiveOtherUserId(otherUserId);
    navigate(getChatRoute(otherUserId));
  };

  const handleSend = () => {
    if (!activeOtherUserId || !draft.trim()) return;
    sendMessage.mutate({ receiverId: activeOtherUserId, content: draft });
    setDraft('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emptyActionLink = user?.role === 'MENTOR' ? appRoutes.mentorRequests : appRoutes.mentors;
  const emptyActionLabel = user?.role === 'MENTOR' ? 'View Learner Requests' : 'Find Mentors';
  const headerSubtitle = user?.role === 'MENTOR' ? 'Manage every learner conversation in one inbox' : 'Manage every mentor conversation in one inbox';

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        <div className="border-b bg-gradient-to-r from-card to-card/95 backdrop-blur-sm px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MessageCircle className="h-7 w-7 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
              </div>
            </div>
            <Link
              to={emptyActionLink}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 px-3 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-all self-start"
            >
              {emptyActionLabel}
            </Link>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-96 lg:w-[26rem] border-r bg-gradient-to-b from-card to-muted/20 flex-col min-w-0`}>
            <div className="p-4 border-b bg-card/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/70"></div>
                    <p className="text-sm text-muted-foreground">Loading conversations...</p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <MessageCircle className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="font-semibold mb-2">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try a different search term.' : 'Start chatting from a mentor profile, session, or proposal.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredConversations.map((conversation) => {
                    const active = conversation.otherUserId === activeOtherUserId;

                    return (
                      <button
                        key={conversation.otherUserId}
                        onClick={() => handleSelectConversation(conversation.otherUserId)}
                        className={`w-full text-left p-4 transition-all hover:bg-secondary/30 ${
                          active ? 'bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                            <User className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold truncate">{conversation.otherName}</p>
                              {conversation.lastMessageAt && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(conversation.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`${showConversationPane ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/10 min-w-0`}>
            {!activeOtherUserId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <MessageCircle className="h-12 w-12 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Your shared inbox</h3>
                  <p className="text-muted-foreground mb-6">
                    Every chat entry point lands here, so you can continue conversations without hunting across multiple pages.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b bg-gradient-to-r from-card to-card/95 backdrop-blur-sm px-4 sm:px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => {
                          setActiveOtherUserId(null);
                          navigate(appRoutes.chat);
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center border-2 border-primary/20">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{activeConversation?.otherName || 'Conversation'}</h3>
                        <p className="text-sm text-muted-foreground">Active conversation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-secondary/80 rounded-xl transition-all">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-secondary/80 rounded-xl transition-all">
                        <Video className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/70"></div>
                          <p className="text-sm text-muted-foreground">Loading messages...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 pt-6">
                        {typedMessages.map((message) => {
                          const mine = message.senderId === user?.id;

                          return (
                            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[88%] sm:max-w-[75%] ${mine ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                                <div
                                  className={`rounded-2xl px-5 py-3 shadow-sm ${
                                    mine
                                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                                      : 'bg-gradient-to-br from-muted/80 to-muted border border-muted/50'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                  <div className={`flex items-center gap-2 mt-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <p className={`text-xs ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {mine && <CheckCheck className="h-3.5 w-3.5 text-blue-400" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {typedMessages.length === 0 && (
                          <div className="text-center py-10">
                            <p className="text-muted-foreground">No messages in this conversation yet.</p>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t bg-gradient-to-t from-card to-card/95 backdrop-blur-sm p-4 shadow-lg">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Type your message..."
                          rows={1}
                          className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/50"
                          disabled={sendMessage.isPending}
                          style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={!draft.trim() || sendMessage.isPending}
                        className="px-4 sm:px-6 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {sendMessage.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SharedChatPage;
