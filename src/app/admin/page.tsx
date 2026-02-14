
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, orderBy, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { Order, MenuItem } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ShoppingBag, Utensils, Settings, Search, Filter, TrendingUp, Users, DollarSign, Loader2, QrCode, Download, Printer, LogOut, Plus, Trash2, Edit, ChevronLeft, Home, ChefHat, CheckCircle2, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { MOCK_TABLES, MOCK_CATEGORIES } from '@/lib/mock-data'
import { QRCodeSVG } from 'qrcode.react'
import { signOut } from 'firebase/auth'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

type AdminView = 'dashboard' | 'orders' | 'qr' | 'menu' | 'kitchen'

export default function AdminDashboard() {
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeView, setActiveView] = useState<AdminView>('dashboard')

  // Form State for new items
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    available: true
  })
  const [isAddingItem, setIsAddingItem] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoading) {
        if (!user) {
          router.push('/login')
          return
        }
        
        try {
          const adminDoc = await getDoc(doc(db, 'roles_admin', user.uid))
          if (adminDoc.exists()) {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
            await signOut(auth)
            router.push('/login')
          }
        } catch (error) {
          console.error("Admin check failed", error)
          setIsAdmin(false)
        }
      }
    }
    checkAdmin()
  }, [user, isUserLoading, router, db, auth])

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || isAdmin === false) return null
    return query(collection(db, 'orders'), orderBy('timestamp', 'desc'))
  }, [db, user, isAdmin])
  
  const menuQuery = useMemoFirebase(() => {
    if (!db || !user || isAdmin === false) return null
    return query(collection(db, 'menu'))
  }, [db, user, isAdmin])
  
  const { data: ordersData, isLoading: ordersLoading } = useCollection<Order>(ordersQuery)
  const { data: menuData, isLoading: menuLoading } = useCollection<MenuItem>(menuQuery)
  
  const orders = ordersData || []
  const menuItems = menuData || []

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'Pending').length
  const preparingOrders = orders.filter(o => o.status === 'Preparing').length
  const readyOrders = orders.filter(o => o.status === 'Ready').length
  const completedToday = orders.filter(o => o.status === 'Served').length

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all required fields." })
      return
    }

    setIsAddingItem(true)
    addDocumentNonBlocking(collection(db, 'menu'), {
      ...newItem,
      price: parseFloat(newItem.price),
      image: `https://picsum.photos/seed/${newItem.name}/600/400`,
      createdAt: serverTimestamp()
    })
    
    setNewItem({ name: '', price: '', categoryId: '', description: '', available: true })
    setIsAddingItem(false)
    toast({ title: "Item Added", description: `${newItem.name} has been added to the menu.` })
  }

  const handleDeleteItem = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'menu', id))
    toast({ title: "Item Deleted", description: "Menu item has been removed." })
  }

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`
    }
    return ''
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  const BackToDashboardButton = () => (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setActiveView('dashboard')}
      className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors"
    >
      <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
    </Button>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold">{pendingOrders + preparingOrders}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ready to Serve</p>
                    <p className="text-2xl font-bold">{readyOrders}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Served Today</p>
                    <p className="text-2xl font-bold">{completedToday}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-md bg-white/90 backdrop-blur cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveView('kitchen')}>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Kitchen Status</CardTitle>
                  <CardDescription>Current active and recently ready orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => ['Preparing', 'Ready'].includes(o.status)).slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={order.status === 'Ready' ? 'bg-green-500' : 'bg-primary'}>Table {order.tableId}</Badge>
                          <span className="text-sm font-medium line-clamp-1">{order.items.map(i => i.name).join(', ')}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                    {orders.filter(o => ['Preparing', 'Ready'].includes(o.status)).length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No active preparation at the moment.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-white/50" onClick={() => setActiveView('menu')}>
                    <Plus className="w-6 h-6" /> Add Menu Item
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-white/50" onClick={() => setActiveView('qr')}>
                    <QrCode className="w-6 h-6" /> Print QR Codes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case 'orders':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <BackToDashboardButton />
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline">Order History</h2>
            </div>
            <Card className="border-none shadow-md bg-white/95 backdrop-blur">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{order.id.substring(0, 6)}</TableCell>
                      <TableCell className="font-bold">Table {order.tableId}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </TableCell>
                      <TableCell className="font-bold text-primary">${order.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          order.status === 'Pending' && "bg-orange-100 text-orange-700",
                          order.status === 'Preparing' && "bg-blue-100 text-blue-700",
                          order.status === 'Ready' && "bg-green-100 text-green-700",
                          order.status === 'Served' && "bg-slate-100 text-slate-700"
                        )}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {order.timestamp?.toDate ? format(order.timestamp.toDate(), 'HH:mm') : 'Now'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                        No orders recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )
      case 'kitchen':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <BackToDashboardButton />
            <h2 className="text-2xl font-headline">Kitchen Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Active Orders Section */}
              {orders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status)).map((order) => (
                <Card key={order.id} className="border-none shadow-md bg-white/95 backdrop-blur">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                    <div>
                      <CardTitle className="font-headline">Table {order.tableId}</CardTitle>
                      <CardDescription>{order.timestamp?.toDate ? format(order.timestamp.toDate(), 'HH:mm') : 'Just now'}</CardDescription>
                    </div>
                    <Badge className={cn(
                      order.status === 'Pending' && "bg-orange-100 text-orange-600",
                      order.status === 'Preparing' && "bg-red-500 text-white",
                      order.status === 'Ready' && "bg-green-500 text-white"
                    )}>
                      {order.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                        </li>
                      ))}
                    </ul>
                    {order.summary && (
                      <div className="mt-4 p-2 bg-muted/30 rounded text-xs italic">
                        Chef's Note: {order.summary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-8" />
            <h3 className="text-lg font-headline text-muted-foreground mb-4">Recently Completed (Served)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
              {orders.filter(o => o.status === 'Served').slice(0, 6).map((order) => (
                <Card key={order.id} className="border-none shadow-sm bg-muted/20 backdrop-blur grayscale-[0.5]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                    <div>
                      <CardTitle className="font-headline text-sm">Table {order.tableId}</CardTitle>
                      <CardDescription className="text-[10px]">{order.timestamp?.toDate ? format(order.timestamp.toDate(), 'HH:mm') : 'Done'}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px]">
                      COMPLETED
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground">
                          {item.quantity}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              {orders.filter(o => o.status === 'Served').length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground italic text-sm">
                  No orders have been completed yet.
                </div>
              )}
            </div>
          </div>
        )
      case 'qr':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <BackToDashboardButton />
            <h2 className="text-2xl font-headline">QR Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_TABLES.map((table) => (
                <Card key={table.id} className="border-none shadow-md bg-white/95 backdrop-blur text-center">
                  <CardHeader>
                    <CardTitle className="font-headline">{table.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl border mb-4 shadow-sm">
                      <QRCodeSVG value={`${getBaseUrl()}/table/${table.id}`} size={160} />
                    </div>
                    <p className="text-xs text-muted-foreground break-all px-4 mb-4">
                      {getBaseUrl()}/table/{table.id}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-center gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Printer className="w-4 h-4" /> Print
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )
      case 'menu':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <BackToDashboardButton />
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline">Menu Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 shadow-md">
                    <Plus className="w-4 h-4 mr-2" /> Add New Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Menu Item</DialogTitle>
                    <DialogDescription>Add a new dish to your restaurant menu.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={val => setNewItem({...newItem, categoryId: val})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="desc">Description</Label>
                      <Input id="desc" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddItem} disabled={isAddingItem} className="w-full sm:w-auto">
                      {isAddingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card className="border-none shadow-md bg-white/95 backdrop-blur">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {MOCK_CATEGORIES.find(c => c.id === item.categoryId)?.name || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={item.available ? "default" : "destructive"}>
                          {item.available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {menuItems.length === 0 && !menuLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                        No menu items found. Start by adding one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen animate-mesh overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white/90 backdrop-blur border-r flex flex-col hidden lg:flex shadow-sm">
        <div className="p-6 border-b flex items-center gap-2">
          <Utensils className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-headline text-primary">QR Bistro</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Button variant="ghost" className={cn("w-full justify-start gap-2", activeView === 'dashboard' && "bg-primary/10 text-primary font-bold")} onClick={() => setActiveView('dashboard')}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", activeView === 'kitchen' && "bg-primary/10 text-primary font-bold")} onClick={() => setActiveView('kitchen')}>
            <ChefHat className="w-4 h-4" /> Kitchen Details
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", activeView === 'orders' && "bg-primary/10 text-primary font-bold")} onClick={() => setActiveView('orders')}>
            <ShoppingBag className="w-4 h-4" /> All Orders
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", activeView === 'qr' && "bg-primary/10 text-primary font-bold")} onClick={() => setActiveView('qr')}>
            <QrCode className="w-4 h-4" /> QR Generation
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", activeView === 'menu' && "bg-primary/10 text-primary font-bold")} onClick={() => setActiveView('menu')}>
            <Utensils className="w-4 h-4" /> Menu Items
          </Button>
        </nav>
        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => router.push('/')}><Home className="w-4 h-4" /> Back to Home</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 bg-white/80 backdrop-blur border-b px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-headline capitalize">{activeView.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden text-primary" onClick={() => router.push('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden text-red-500" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
