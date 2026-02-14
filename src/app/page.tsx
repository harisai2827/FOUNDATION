
"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Store, UtensilsCrossed, ChefHat } from 'lucide-react'
import { MOCK_TABLES } from '@/lib/mock-data'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-headline text-primary mb-2">QR Bistro</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Scan to order, sit back, and enjoy your meal. Real-time dining reimagined.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="hover:shadow-lg transition-shadow border-primary/20 bg-white/50 backdrop-blur">
          <CardHeader className="text-center">
            <UtensilsCrossed className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="font-headline">Customer Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Simulate scanning a QR code by choosing a table below.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_TABLES.map((table) => (
                <Link key={table.id} href={`/table/${table.id}`} className="w-full">
                  <Button variant="outline" className="w-full hover:bg-primary/10 border-primary/20">
                    {table.name}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-secondary/20 bg-white/50 backdrop-blur">
          <CardHeader className="text-center">
            <ChefHat className="w-12 h-12 text-secondary mx-auto mb-2" />
            <CardTitle className="font-headline">Kitchen View</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Real-time orders for the chef. Status updates and GenAI summaries.
            </p>
            <Link href="/kitchen" className="w-full">
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Go to Kitchen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/20 bg-white/50 backdrop-blur">
          <CardHeader className="text-center">
            <Store className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="font-headline">Admin Portal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Manage menu items, categories, and monitor all restaurant operations.
            </p>
            <Link href="/admin" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Admin Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="text-muted-foreground text-xs mt-8">
        © 2024 QR Bistro. All rights reserved.
      </footer>
    </div>
  )
}
