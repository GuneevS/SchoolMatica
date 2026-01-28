import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications | SchoolMatica",
  description: "View all your notifications and updates.",
};

async function getNotifications(userId: string, filter: "all" | "unread") {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(filter === "unread" && { read: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

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
}

function NotificationList({ notifications }: NotificationListProps) {
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
                            onClick={() => window.location.href = notification.actionUrl}
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

export default async function NotificationsPage() {
  const auth = await requireAuth();
  
  if (!auth?.user) {
    redirect("/login");
  }

  const allNotifications = await getNotifications(auth.user.id, "all");
  const unreadNotifications = allNotifications.filter(n => !n.read);

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
            <Button variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({allNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList notifications={allNotifications} />
          </Suspense>
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList notifications={unreadNotifications} />
          </Suspense>
        </TabsContent>

        <TabsContent value="behavior" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList 
              notifications={allNotifications.filter(n => n.type === "behavior")} 
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList 
              notifications={allNotifications.filter(n => n.type === "grade")} 
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList 
              notifications={allNotifications.filter(n => n.type === "message")} 
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <NotificationList 
              notifications={allNotifications.filter(n => n.type === "system")} 
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
