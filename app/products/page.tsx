// app/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Product } from '../../types'
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(db, 'products'))
        const data: Product[] = []
        querySnapshot.forEach(docSnap => {
          const docData = docSnap.data()
          data.push({
            id: docSnap.id,
            code: docData.code,
            nameAr: docData.nameAr,
            nameEn: docData.nameEn,
            images: docData.images || [],
            boxCapacity: docData.boxCapacity,
            defaultPurchasePrice: docData.defaultPurchasePrice,
            defaultSellingPrice: docData.defaultSellingPrice,
            createdAt: docData.createdAt,
            updatedAt: docData.updatedAt
          })
        })
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const handleAddProduct = () => {
    router.push('/products/new')
  }

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Products
      </Typography>
      <Button variant='contained' onClick={handleAddProduct} sx={{ mb: 3 }}>
        Add New Product
      </Button>

      {loading ? (
        <Typography>Loading products...</Typography>
      ) : (
        // Replace Grid with Box
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr 1fr'
            }
          }}
        >
          {products.map(product => {
            const firstImage =
              product.images && product.images.length > 0 ? product.images[0] : ''

            return (
              <Box key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {firstImage ? (
                    <CardMedia
                      component='img'
                      height='140'
                      image={firstImage}
                      alt={`${product.nameEn}`}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0'
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        No Image
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant='h6'>{product.nameEn}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      (Code: {product.code})
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Box Capacity: {product.boxCapacity}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button onClick={() => router.push(`/products/${product.id}`)}>
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
