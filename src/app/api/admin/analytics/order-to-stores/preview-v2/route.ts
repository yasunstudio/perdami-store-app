import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Preview-V2] Full request body:', JSON.stringify(body, null, 2));
    
    const { filters } = body;
    
    if (!filters) {
      console.log('[Preview-V2] No filters provided');
      return NextResponse.json({ error: 'Filters are required' }, { status: 400 });
    }
    
    console.log('[Preview-V2] Filters received:', JSON.stringify(filters, null, 2));
    
    // Handle different date range formats
    let dateFilter = null;
    if (filters.dateRange) {
      const dateRange = filters.dateRange;
      let startDate, endDate;
      
      // Support multiple date range formats
      if (dateRange.from && dateRange.to) {
        startDate = new Date(dateRange.from);
        endDate = new Date(dateRange.to);
      } else if (dateRange.startDate && dateRange.endDate) {
        startDate = new Date(dateRange.startDate);
        endDate = new Date(dateRange.endDate);
      } else if (dateRange.start && dateRange.end) {
        startDate = new Date(dateRange.start);
        endDate = new Date(dateRange.end);
      }
      
      if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        dateFilter = {
          gte: startDate,
          lte: endDate
        };
        
        console.log('[Preview-V2] Date filter created:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      } else {
        console.log('[Preview-V2] Invalid date range, skipping date filter');
      }
    }
    
    // First, let's get ALL confirmed orders to see what we have
    console.log('[Preview-V2] Fetching all confirmed orders...');
    const allConfirmedOrders = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED'
      },
      include: {
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit for debugging
    });
    
    console.log(`[Preview-V2] Found ${allConfirmedOrders.length} total confirmed orders`);
    
    // Log each order with details
    allConfirmedOrders.forEach((order, index) => {
      const stores = order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean);
      const uniqueStores = [...new Set(stores)];
      
      console.log(`[Preview-V2] Order ${index + 1}:`, {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        hour: order.createdAt.getHours(),
        totalAmount: order.totalAmount,
        stores: uniqueStores,
        itemsCount: order.orderItems.length
      });
    });
    
    // Now apply filters step by step
    let filteredOrders = allConfirmedOrders;
    
    // Apply date filter if specified
    if (dateFilter) {
      console.log('[Preview-V2] Applying date filter...');
      const beforeDateFilter = filteredOrders.length;
      
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = order.createdAt;
        const matches = orderDate >= dateFilter.gte && orderDate <= dateFilter.lte;
        
        if (!matches) {
          console.log(`[Preview-V2] Order ${order.id} excluded by date filter: ${orderDate.toISOString()}`);
        }
        
        return matches;
      });
      
      console.log(`[Preview-V2] Date filter: ${beforeDateFilter} -> ${filteredOrders.length} orders`);
    }
    
    // Apply store filter if specified
    if (filters.storeIds && filters.storeIds.length > 0) {
      console.log('[Preview-V2] Applying store filter for:', filters.storeIds);
      const beforeStoreFilter = filteredOrders.length;
      
      filteredOrders = filteredOrders.filter(order => {
        const orderStoreIds = order.orderItems
          .map(item => item.bundle?.store?.id)
          .filter(Boolean);
        
        const orderStoreNames = order.orderItems
          .map(item => item.bundle?.store?.name)
          .filter(Boolean);
        
        const matches = orderStoreIds.some(storeId => filters.storeIds.includes(storeId));
        
        console.log(`[Preview-V2] Order ${order.id} stores:`, {
          storeIds: orderStoreIds,
          storeNames: orderStoreNames,
          filterStoreIds: filters.storeIds,
          matches
        });
        
        return matches;
      });
      
      console.log(`[Preview-V2] Store filter: ${beforeStoreFilter} -> ${filteredOrders.length} orders`);
    }
    
    // Apply batch filter if specified
    if (filters.batchIds && filters.batchIds.length > 0) {
      console.log('[Preview-V2] Applying batch filter for:', filters.batchIds);
      const beforeBatchFilter = filteredOrders.length;
      
      filteredOrders = filteredOrders.filter(order => {
        const orderHour = order.createdAt.getHours();
        
        const matchesBatch = filters.batchIds.some((batchId: string) => {
          if (batchId === 'batch_1') {
            return orderHour >= 6 && orderHour < 18;
          } else if (batchId === 'batch_2') {
            return orderHour >= 18 || orderHour < 6;
          }
          return false;
        });
        
        console.log(`[Preview-V2] Order ${order.id} hour ${orderHour}, matches batch: ${matchesBatch}`);
        
        return matchesBatch;
      });
      
      console.log(`[Preview-V2] Batch filter: ${beforeBatchFilter} -> ${filteredOrders.length} orders`);
    }
    
    console.log(`[Preview-V2] Final filtered orders: ${filteredOrders.length}`);
    
    // Calculate summary statistics
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Get store statistics
    const storeStats: Record<string, any> = {};
    
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          const store = item.bundle.store;
          const storeId = store.id;
          
          if (!storeStats[storeId]) {
            storeStats[storeId] = {
              id: store.id,
              name: store.name,
              ordersCount: 0,
              totalValue: 0,
              orderIds: new Set()
            };
          }
          
          // Only count each order once per store
          if (!storeStats[storeId].orderIds.has(order.id)) {
            storeStats[storeId].orderIds.add(order.id);
            storeStats[storeId].ordersCount++;
            storeStats[storeId].totalValue += Number(order.totalAmount);
          }
        }
      });
    });
    
    // Convert to array and clean up
    const stores = Object.values(storeStats).map((store: any) => ({
      id: store.id,
      name: store.name,
      ordersCount: store.ordersCount,
      totalValue: store.totalValue
    }));
    
    console.log('[Preview-V2] Store statistics:', stores);
    
    const result = {
      summary: {
        totalOrders,
        totalValue,
        averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
        storesCount: stores.length
      },
      stores,
      orders: filteredOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        stores: [...new Set(order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean))]
      })),
      filters: filters,
      debug: {
        totalConfirmedOrders: allConfirmedOrders.length,
        finalFilteredOrders: filteredOrders.length,
        dateFilterApplied: !!dateFilter,
        storeFilterApplied: !!(filters.storeIds && filters.storeIds.length > 0),
        batchFilterApplied: !!(filters.batchIds && filters.batchIds.length > 0)
      }
    };
    
    console.log('[Preview-V2] Final result summary:', result.summary);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Preview-V2] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
