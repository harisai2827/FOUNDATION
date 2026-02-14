
"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser, useAuth } from '@/firebase'
import { Order, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChefHat, Clock, CheckCircle, Flame, BellRing, Loader2, LogOut, Home } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { generateAudibleNotificationTrigger } from '@/ai/flows/generate-audible-notification-trigger'
import { signOut } from 'firebase/auth'
import { Separator } from '@/components/ui/separator'

export default function KitchenDashboard() {
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'orders'), orderBy('timestamp', 'desc'))
  }, [db, user])

  const { data: orderList, isLoading: loading } = useCollection<Order>(ordersQuery)
  const orders = orderList || []
  
  const lastOrderCountRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (orders.length > lastOrderCountRef.current && lastOrderCountRef.current !== 0) {
      const handleNewOrder = async () => {
        const now = new Date()
        const timeOfDay = format(now, 'h:mm a')
        const dayOfWeek = format(now, 'EEEE')
        
        try {
          const { triggerNotification, reason } = await generateAudibleNotificationTrigger({
            orderQueueLength: orders.filter(o => o.status === 'Pending').length,
            timeOfDay,
            dayOfWeek
          })

          if (triggerNotification) {
            playNotificationSound()
            toast({
              title: "New Order Alert!",
              description: reason,
            })
          }
        } catch (e) {
          console.error("Notification decision error", e)
        }
      }
      handleNewOrder()
    }
    lastOrderCountRef.current = orders.length
  }, [orders])

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1)
    } catch (e) {
      console.warn("Audio play blocked", e)
    }
  }

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId)
    updateDocumentNonBlocking(orderRef, { status: newStatus })
    toast({
      title: "Status Updated",
      description: `Order set to ${newStatus}`,
    })
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-orange-500" />
      case 'Preparing': return <Flame className="w-4 h-4 text-red-500 animate-pulse" />
      case 'Ready': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-screen animate-mesh overflow-hidden">
      <header className="bg-white/80 backdrop-blur border-b p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="mr-2">
            <Home className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="bg-primary/10 p-2 rounded-full">
            <ChefHat className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-headline text-primary">Kitchen Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="border-secondary text-secondary-foreground bg-white/50 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live System
          </Badge>
          <Button variant="ghost" size="icon" onClick={playNotificationSound}>
            <BellRing className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orders.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ChefHat className="w-16 h-16 opacity-20 mb-4" />
                  <p className="text-lg">No active orders right now.</p>
                </div>
              )}
              {orders.map((order) => (
                <Card 
                  key={order.id} 
                  className={`flex flex-col border-2 transition-all duration-300 backdrop-blur bg-white/90 ${
                    order.status === 'Pending' ? 'border-primary animate-in zoom-in-95 shadow-lg' : 'border-white/50 shadow-sm'
                  }`}
                >
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between bg-white/50">
                    <div>
                      <CardTitle className="font-headline text-lg">Table {order.tableId}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {order.timestamp?.toDate ? format(order.timestamp.toDate(), 'h:mm a') : 'Just now'}
                      </p>
                    </div>
                    <Badge className={`
                      ${order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : ''}
                      ${order.status === 'Preparing' ? 'bg-red-100 text-red-700' : ''}
                      ${order.status === 'Ready' ? 'bg-green-100 text-green-700' : ''}
                      flex items-center gap-1
                    `}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 bg-muted/10">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-primary">{item.quantity}x</span>
                              <span className="font-medium text-foreground">{item.name}</span>
                            </div>
                          </div>
                          {item.specialRequests && (
                            <p className="text-xs text-destructive italic mt-1 bg-red-50 p-1 rounded">
                              Note: {item.specialRequests}
                            </p>
                          )}
                        </div>
                      ))}
                      {order.summary && (
                        <div className="mt-4 p-3 bg-white/80 rounded-lg border border-primary/10">
                          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Chef's Summary</p>
                          <p className="text-sm text-foreground italic">"{order.summary}"</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 bg-white/50 border-t gap-2">
                    {order.status === 'Pending' && (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => updateStatus(order.id, 'Preparing')}
                      >
                        Start Cooking
                      </Button>
                    )}
                    {order.status === 'Preparing' && (
                      <Button 
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        onClick={() => updateStatus(order.id, 'Ready')}
                      >
                        Order Ready
                      </Button>
                    )}
                    {order.status === 'Ready' && (
                      <Button 
                        variant="outline"
                        className="w-full border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => updateStatus(order.id, 'Served')}
                      >
                        Served
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>
    </div>
  )
}
