
import { Category, MenuItem, Table } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Main Course', icon: 'Utensils' },
  { id: 'cat2', name: 'Fast Food', icon: 'Pizza' },
  { id: 'cat3', name: 'Salads', icon: 'Leaf' },
  { id: 'cat4', name: 'Beverages', icon: 'Coffee' },
];

export const MOCK_MENU: MenuItem[] = [
  {
    id: 'item1',
    name: 'Gourmet Beef Burger',
    price: 12.99,
    categoryId: 'cat2',
    image: 'https://picsum.photos/seed/burger/600/400',
    description: 'A juicy grass-fed beef patty with melted cheddar, fresh lettuce, and our secret sauce.',
    available: true,
  },
  {
    id: 'item2',
    name: 'Creamy Alfredo Pasta',
    price: 14.50,
    categoryId: 'cat1',
    image: 'https://picsum.photos/seed/pasta/600/400',
    description: 'Classic italian pasta with a rich parmesan cream sauce and grilled chicken strips.',
    available: true,
  },
  {
    id: 'item3',
    name: 'Margherita Pizza',
    price: 11.00,
    categoryId: 'cat2',
    image: 'https://picsum.photos/seed/pizza/600/400',
    description: 'Simple and elegant with fresh tomato sauce, mozzarella, and basil leaves.',
    available: true,
  },
  {
    id: 'item4',
    name: 'Caesar Salad',
    price: 9.50,
    categoryId: 'cat3',
    image: 'https://picsum.photos/seed/salad/600/400',
    description: 'Crispy romaine lettuce, croutons, and parmesan tossed with our house Caesar dressing.',
    available: true,
  },
  {
    id: 'item5',
    name: 'Tropical Iced Tea',
    price: 4.00,
    categoryId: 'cat4',
    image: 'https://picsum.photos/seed/drink/600/400',
    description: 'Refreshing black tea infused with passionfruit and mango essences.',
    available: true,
  },
];

export const MOCK_TABLES: Table[] = [
  { id: '1', name: 'Table 1' },
  { id: '2', name: 'Table 2' },
  { id: '3', name: 'Table 3' },
  { id: '4', name: 'Table 4' },
  { id: '5', name: 'Table 5' },
];
