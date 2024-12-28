// app/products/[productId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { Product } from '../../../types'
import { Box, Typography, Button, Divider } from '@mui/material'
import { useAuth } from '../../providers/AuthProvider'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      try {
        const docRef = doc(db, 'products', productId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Product, 'id'>
          setProduct({ id: docSnap.id, ...data })
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [productId])

  const handleDelete = async () => {
    if (!user || user.role !== 'editor') {
      alert('You do not have permission to delete products.')
      return
    }
    const confirmed = confirm('Are you sure you want to delete this product?')
    if (!confirmed) return

    try {
      await deleteDoc(doc(db, 'products', productId))
      alert('Product deleted successfully!')
      router.push('/products')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product.')
    }
  }

  if (loading) {
    return <Typography>Loading product...</Typography>
  }

  if (!product) {
    return <Typography>Product not found.</Typography>
  }

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Product Detail
      </Typography>
      <Typography>
        <strong>ID:</strong> {product.id}
      </Typography>
      <Typography>
        <strong>Code:</strong> {product.code}
      </Typography>
      <Typography>
        <strong>Arabic Name:</strong> {product.nameAr}
      </Typography>
      <Typography>
        <strong>English Name:</strong> {product.nameEn}
      </Typography>
      <Typography>
        <strong>Box Capacity:</strong> {product.boxCapacity}
      </Typography>
      <Typography>
        <strong>Default Purchase Price:</strong> {product.defaultPurchasePrice ?? '-'}
      </Typography>
      <Typography>
        <strong>Default Selling Price:</strong> {product.defaultSellingPrice ?? '-'}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Button
        variant='contained'
        onClick={() => router.push(`/products/${product.id}/edit`)}
        sx={{ mr: 2 }}
      >
        Edit Product
      </Button>
      <Button variant='outlined' color='error' onClick={handleDelete}>
        Delete Product
      </Button>

      <Divider sx={{ my: 2 }} />
      <Typography variant='h6' gutterBottom>
        Transactions for this Product
      </Typography>
      <Button
        variant='contained'
        onClick={() => router.push(`/products/${product.id}/transactions`)}
      >
        View Transactions
      </Button>
    </Box>
  )
}
