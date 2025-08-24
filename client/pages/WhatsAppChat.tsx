import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Image as ImageIcon, 
  Download, 
  CheckCheck, 
  Check, 
  Clock,
  User,
  Car,
  Package,
  CreditCard,
  Truck
} from "lucide-react";
import { Link } from "react-router-dom";
import { SparePartRequest } from "@shared/types";

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: "text" | "image" | "document";
  status: "sending" | "sent" | "delivered" | "read";
  isFromCustomer: boolean;
  mediaUrl?: string;
  fileName?: string;
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  requestId?: string;
  request?: SparePartRequest;
}

const mockContacts: WhatsAppContact[] = [
  {
    id: "1",
    name: "Ahmed Al-Rashid",
    phone: "+966551234567",
    lastMessage: "شكراً لكم، أنتظر الرد",
    lastMessageTime: "2024-01-15T10:30:00Z",
    unreadCount: 2,
    isOnline: true,
    requestId: "REQ-2024-001",
    request: {
      request_id: "REQ-2024-001",
      timestamp: "2024-01-15T10:30:00Z",
      customer_name: "Ahmed Al-Rashid",
      phone_number: "+966551234567",
      email: "ahmed@example.com",
      vehicle_estamra: "ABC123",
      vin_number: "KMHXX00XXXX000001",
      part_name: "Front brake pads for Hyundai Sonata 2022",
      status: "Pending",
      payment_status: "Pending",
      whatsapp_sent: false,
    }
  },
  {
    id: "2",
    name: "Fatima Al-Zahra",
    phone: "+966559876543",
    lastMessage: "متى سيتم توصيل القطعة؟",
    lastMessageTime: "2024-01-15T09:15:00Z",
    unreadCount: 0,
    isOnline: false,
    requestId: "REQ-2024-002",
  },
  {
    id: "3",
    name: "Mohammed Al-Saud",
    phone: "+966501234567",
    lastMessage: "تم استلام الدفع بنجاح",
    lastMessageTime: "2024-01-14T16:45:00Z",
    unreadCount: 1,
    isOnline: true,
  }
];

const mockMessages: WhatsAppMessage[] = [
  {
    id: "1",
    from: "+966551234567",
    to: "+966500000000",
    message: "السلام عليكم، أريد السؤال عن قطعة الفرامل",
    timestamp: "2024-01-15T10:25:00Z",
    type: "text",
    status: "read",
    isFromCustomer: true
  },
  {
    id: "2",
    from: "+966500000000",
    to: "+966551234567",
    message: "وعليكم السلام، أهلاً بك. سنتحقق من توفر القطعة ونرد عليك خلال 24 ساعة.",
    timestamp: "2024-01-15T10:27:00Z",
    type: "text",
    status: "read",
    isFromCustomer: false
  },
  {
    id: "3",
    from: "+966551234567",
    to: "+966500000000",
    message: "شكراً لكم، أنتظر الرد",
    timestamp: "2024-01-15T10:30:00Z",
    type: "text",
    status: "delivered",
    isFromCustomer: true
  }
];

export default function WhatsAppChat() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(mockContacts);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(mockContacts[0]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    setIsSending(true);
    
    const message: WhatsAppMessage = {
      id: Date.now().toString(),
      from: "+966500000000",
      to: selectedContact.phone,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "sending",
      isFromCustomer: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate API call
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: "sent" } : msg
      ));
      setIsSending(false);
    }, 1000);

    // Update contact's last message
    setContacts(prev => prev.map(contact =>
      contact.id === selectedContact.id
        ? { 
            ...contact, 
            lastMessage: newMessage,
            lastMessageTime: new Date().toISOString()
          }
        : contact
    ));
  };

  const sendTemplate = async (templateType: string) => {
    if (!selectedContact) return;

    let templateMessage = "";
    
    switch (templateType) {
      case "availability":
        templateMessage = `🚗 تحديث قطع غيار هيونداي

طلبكم ${selectedContact.requestId} متوفر الآن!

لقد عثرنا على القطعة المطلوبة وهي جاهزة للطلب. يرجى استخدام رابط الدفع أدناه للمتابعة:

💳 رابط الدفع: [رابط الدفع]

⏰ سينتهي صلاحية هذا الرابط خلال 24 ساعة.

لأي استفسار، يرجى الرد على هذه الرسالة.

مع تحيات فريق هيونداي السعودية`;
        break;
      case "payment_confirmed":
        templateMessage = `✅ تم تأكيد الدفع

شكراً لك على الدفع للطلب ${selectedContact.requestId}.

تم تأكيد طلب قطعة الغيار وسيتم معالجته للإرسال خلال 2-3 أيام عمل.

📦 ستستلم معلومات التتبع عند ��رسال القطعة.

مع تحيات فريق هيونداي السعودية`;
        break;
      case "dispatched":
        templateMessage = `🚚 تم إرسال القطعة

تم إرسال قطعة الغيار للطلب ${selectedContact.requestId}!

📦 رقم التتبع: [رقم التتبع]
🚛 شركة الشحن: [اسم الشركة]
📅 التاريخ المتوقع للتسليم: [التاريخ المتوقع]

تتبع شحنتك: [رابط التتبع]

مع تحيات فريق هيونداي السعودية`;
        break;
    }

    const message: WhatsAppMessage = {
      id: Date.now().toString(),
      from: "+966500000000",
      to: selectedContact.phone,
      message: templateMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "sent",
      isFromCustomer: false
    };

    setMessages(prev => [...prev, message]);
    setIsTemplateDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Available": return "bg-blue-100 text-blue-800";
      case "Payment Sent": return "bg-purple-100 text-purple-800";
      case "Paid": return "bg-green-100 text-green-800";
      case "Dispatched": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Dual Logo Branding */}
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F89209ad27c684dbc9b90f452ff107a5b?format=webp&width=800"
                    alt="Hyundai"
                    className="h-8 w-auto"
                  />
                </div>
                <div className="text-white/60 text-lg">×</div>
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F6bea580910924f218a7dc8e31190ff81?format=webp&width=800"
                    alt="Wallan Group"
                    className="h-8 w-auto"
                  />
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  WhatsApp Chat
                </h1>
                <p className="text-green-100 text-sm">Customer Communication Center</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/settings"
                className="text-green-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Settings
              </Link>
              <Link
                to="/dashboard"
                className="text-green-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6 h-[700px]">
          {/* Contact List */}
          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? 'bg-hyundai-light-blue' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {contact.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.name}
                            </p>
                            {contact.lastMessageTime && (
                              <p className="text-xs text-gray-500">
                                {formatTime(contact.lastMessageTime)}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {contact.lastMessage || "No messages"}
                            </p>
                            {contact.unreadCount > 0 && (
                              <Badge className="bg-green-500 text-white text-xs">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          {contact.requestId && (
                            <p className="text-xs text-hyundai-blue mt-1">
                              {contact.requestId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="col-span-8">
            {selectedContact ? (
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={selectedContact.avatar} />
                        <AvatarFallback>
                          {selectedContact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold">{selectedContact.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedContact.phone}
                          {selectedContact.isOnline && (
                            <span className="ml-2 text-green-500">● Online</span>
                          )}
                        </p>
                        {selectedContact.requestId && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {selectedContact.requestId}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Templates
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Message Templates</DialogTitle>
                            <DialogDescription>
                              Send predefined messages to customers
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-3">
                            <Button
                              onClick={() => sendTemplate("availability")}
                              className="w-full justify-start"
                              variant="outline"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Part Available Notification
                            </Button>
                            
                            <Button
                              onClick={() => sendTemplate("payment_confirmed")}
                              className="w-full justify-start"
                              variant="outline"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Payment Confirmation
                            </Button>
                            
                            <Button
                              onClick={() => sendTemplate("dispatched")}
                              className="w-full justify-start"
                              variant="outline"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Dispatch Notification
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Customer Request Info */}
                  {selectedContact.request && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Request Details
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs ${getRequestStatusColor(selectedContact.request.status)}`}>
                          {selectedContact.request.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">VIN:</span> {selectedContact.request.vin_number}
                        </div>
                        <div>
                          <span className="text-gray-500">Estamra:</span> {selectedContact.request.vehicle_estamra}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Part:</span> {selectedContact.request.part_name}
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromCustomer ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isFromCustomer
                                ? 'bg-white border text-gray-900'
                                : 'bg-hyundai-blue text-white'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className={`flex items-center justify-between mt-1 gap-2 ${
                              message.isFromCustomer ? 'text-gray-500' : 'text-blue-100'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.timestamp)}
                              </span>
                              {!message.isFromCustomer && (
                                <div className="flex items-center">
                                  {getStatusIcon(message.status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
