// lib/products-server.js
import { PRODUCTS } from '@/constants/products'

export async function getProductServer(id) {
  return PRODUCTS.find((p) => String(p.id) === String(id)) ?? null
}
