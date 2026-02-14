
"use client"

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, serverTimestamp, query, where } from 'firebase/firestore'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser, useAuth, initiateAnonymousSignIn } from '@/firebase'
import { MOCK_CATEGORIES, MOCK_TABLES } from '@/lib/mock-data'
import { MenuItem, OrderItem, OrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Plus, Minus, CheckCircle2, Search, ArrowLeft, Loader2, UtensilsCrossed, Tag } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { summarizeOrderDetails } from '@/ai/flows/summarize-order-details'

export default function CustomerMenu() {
  const db = useFirestore()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const params = useParams()
  const tableId = params?.id as string
  const router = useRouter()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [isOrdered, setIsOrdered] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)

  // Fetch real menu items from Firestore
  const menuQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, 'menu'), where('available', '==', true))
  }, [db])

  const { data: menuData, isLoading: menuLoading } = useCollection<MenuItem>(menuQuery)
  const menuItems = menuData || []

  // Ensure customer is signed in (anonymously or otherwise)
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth)
    }
  }, [user, isUserLoading, auth])

  const tableName = MOCK_TABLES.find(t => t.id === tableId)?.name || `Table ${tableId}`

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id)
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
    toast({
      title: "Added to cart",
      description: `${item.name} added.`,
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.itemId !== itemId)
    })
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0 || !user) return
    setIsOrdering(true)
    try {
      // Generate AI Summary for chef
      const orderItemsForAI = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        specialRequests: item.specialRequests || ""
      }))
      
      const { summary } = await summarizeOrderDetails({ items: orderItemsForAI })

      addDocumentNonBlocking(collection(db, 'orders'), {
        tableId,
        customerId: user.uid,
        items: cart,
        totalPrice: cartTotal,
        status: 'Pending' as OrderStatus,
        timestamp: serverTimestamp(),
        summary: summary
      })

      setCart([])
      setIsOrdered(true)
      toast({
        title: "Order Placed!",
        description: "Your delicious meal is being prepared.",
      })
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Please try again or call a waiter.",
      })
    } finally {
      setIsOrdering(false)
    }
  }

  if (isUserLoading || menuLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isOrdered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-6">
        <div className="bg-white p-12 rounded-full shadow-2xl animate-bounce">
          <CheckCircle2 className="w-24 h-24 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-headline text-primary">Order Placed Successfully!</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Sit tight, your order for <strong>{tableName}</strong> is being prepared by our chefs.
          </p>
        </div>
        <Button onClick={() => setIsOrdered(false)} variant="outline" className="border-primary text-primary">
          Order More
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-headline text-primary">QR Bistro</h1>
            <p className="text-xs text-muted-foreground">{tableName}</p>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="relative bg-primary hover:bg-primary/90 rounded-full h-12 w-12 shadow-lg">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground h-6 w-6 rounded-full flex items-center justify-center p-0 border-2 border-white">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl flex items-center justify-between">
                Your Order
                <Badge variant="outline" className="text-primary border-primary">
                  {tableName}
                </Badge>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                {cart.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto opacity-20 mb-2" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.itemId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-primary font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-muted rounded-full p-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => removeFromCart(item.itemId)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => {
                              const fullItem = menuItems.find(m => m.id === item.itemId);
                              if (fullItem) addToCart(fullItem);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="mt-6 space-y-4">
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary text-2xl">${cartTotal.toFixed(2)}</span>
                </div>
                <Button 
                  onClick={placeOrder} 
                  disabled={cart.length === 0 || isOrdering || !user}
                  className="w-full bg-primary hover:bg-primary/90 h-14 text-lg font-headline rounded-xl"
                >
                  {isOrdering ? "Placing Order..." : "Confirm & Place Order"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Search & Categories */}
      <div className="p-4 space-y-4 bg-background/95 backdrop-blur sticky top-[73px] z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search our delicious menu..." 
            className="pl-10 rounded-full border-primary/20 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          <Button 
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="rounded-full flex-shrink-0 h-8 text-xs"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {MOCK_CATEGORIES.map((cat) => (
            <Button 
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className="rounded-full flex-shrink-0 h-8 text-xs"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Line-wise Menu Items List */}
      <main className="flex-1 p-4 space-y-2">
        {filteredMenu.map((item) => (
          <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden hover:bg-muted/5 transition-colors">
            <div className="flex items-center p-3 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-base text-foreground truncate">{item.name}</h3>
                  <span className="font-bold text-primary whitespace-nowrap">${item.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {item.description}
                </p>
              </div>
              <Button 
                size="sm"
                onClick={() => addToCart(item)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0 h-9 w-9 rounded-full p-0 flex items-center justify-center shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
        {filteredMenu.length === 0 && !menuLoading && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted mb-4 opacity-50" />
            <p className="font-headline text-muted-foreground">No items found.</p>
          </div>
        )}
      </main>
    </div>
  )
}
