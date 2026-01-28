"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "behavior":
      return "🎯";
    case "grade":
      return "📝";
    case "message":
      return "💬";
    case "announcement":
      return "📢";
    case "report":
      return "📊";
    default:
      return "🔔";
  }
}

function getTimeSince(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

interface NotificationListProps {
  notifications: any[];
  onMarkAsRead: (id: string, actionUrl: string | null) => void;
  onRefresh: () => void;
}

function NotificationList({ notifications, onMarkAsRead, onRefresh }: NotificationListProps) {
  const router = useRouter();
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-[hsl(var(--surface-soft))] flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! We'll notify you when something needs your attention.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={cn(
            "overflow-hidden transition-all hover:shadow-md",
            !notification.read && "border-[hsl(var(--accent-iris))]/30 bg-[hsl(var(--accent-iris))]/5"
          )}
        >
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Unread indicator */}
              {!notification.read && (
                <div className="w-1 bg-[hsl(var(--accent-iris))]" />
              )}
              
              <div className="flex-1 p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "font-semibold text-sm leading-tight",
                        !notification.read && "text-foreground"
                      )}>
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.body}
                    </p>
                    
                      <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {getTimeSince(notification.createdAt)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {notification.actionUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => onMarkAsRead(notification.id, notification.actionUrl)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => onMarkAsRead(notification.id, null)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const unreadNotifications = notifications.filter(n => !n.read);
  
  const markAsRead = async (id: string, actionUrl: string | null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      
      await fetchNotifications();
      
      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };
  
  const clearAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications? This cannot be undone.")) {
      return;
    }
    
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread"
    ? unreadNotifications
    : notifications.filter(n => n.type === activeTab);
  
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important events and messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="grade">Grades</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <NotificationList 
            notifications={filteredNotifications} 
            onMarkAsRead={markAsRead}
            onRefresh={fetchNotifications}
          />
        </div>
      </Tabs>
    </div>
  );
}
