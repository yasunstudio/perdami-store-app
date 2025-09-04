import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { filters, exportOptions } = await request.json();
    
    if (!filters || !exportOptions) {
      return NextResponse.json(
        { error: 'Filters and export options are required' },
        { status: 400 }
      );
    }

    // Validate export options
    if (!exportOptions.format || !exportOptions.template) {
      return NextResponse.json(
        { error: 'Export format and template are required' },
        { status: 400 }
      );
    }

    // Validate that we have data to export (at least one store or batch selected)
    if (filters.storeIds.length === 0 && filters.batchIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one store or batch to export' },
        { status: 400 }
      );
    }

    // Build the where clause for filtering
    const whereClause: any = {};
    
    // Date range filter
    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      whereClause.createdAt = {
        gte: new Date(filters.dateRange.startDate),
        lte: new Date(filters.dateRange.endDate)
      };
    }

    // Batch filter (if specified)
    const batchFilter: any = {};
    if (filters.batchIds && filters.batchIds.length > 0) {
      // Create time-based batch filtering logic
      const batchConditions = filters.batchIds.map((batchId: string) => {
        if (batchId === 'batch-1') {
          // Morning batch: 07:00-19:00
          return {
            AND: [
              {
                createdAt: {
                  gte: new Date(new Date().setHours(7, 0, 0, 0))
                }
              },
              {
                createdAt: {
                  lt: new Date(new Date().setHours(19, 0, 0, 0))
                }
              }
            ]
          };
        } else if (batchId === 'batch-2') {
          // Evening batch: 19:00-07:00 (next day)
          return {
            OR: [
              {
                createdAt: {
                  gte: new Date(new Date().setHours(19, 0, 0, 0))
                }
              },
              {
                createdAt: {
                  lt: new Date(new Date().setHours(7, 0, 0, 0))
                }
              }
            ]
          };
        }
        return {};
      });

      if (batchConditions.length > 0) {
        batchFilter.OR = batchConditions;
      }
    }

    // Combine filters
    if (Object.keys(batchFilter).length > 0) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push(batchFilter);
    }

    // Store filter (through orderItems -> bundle -> store relationship)
    if (filters.storeIds && filters.storeIds.length > 0) {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: {
              in: filters.storeIds
            }
          }
        }
      };
    }

    // Fetch the filtered orders from database
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found matching the specified criteria' },
        { status: 404 }
      );
    }

    // Generate unique timestamp for this export
    const timestamp = Date.now();
    
    // Build query parameters for download URL
    const downloadParams = new URLSearchParams({
      format: exportOptions.format,
      template: exportOptions.template,
      timestamp: timestamp.toString(),
      orderCount: orders.length.toString()
    });

    // Add filter parameters
    if (filters.storeIds && filters.storeIds.length > 0) {
      downloadParams.append('storeIds', filters.storeIds.join(','));
    }
    if (filters.batchIds && filters.batchIds.length > 0) {
      downloadParams.append('batchIds', filters.batchIds.join(','));
    }
    if (filters.dateRange?.startDate) {
      downloadParams.append('startDate', filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      downloadParams.append('endDate', filters.dateRange.endDate);
    }
    
    // Create the download URL with all necessary parameters
    const downloadUrl = `/api/admin/analytics/order-to-stores/export/download?${downloadParams.toString()}`;

    // Store export metadata (optional - for tracking)
    console.log(`Export requested: ${exportOptions.format} format, ${exportOptions.template} template, ${orders.length} orders`);

    return NextResponse.json({
      success: true,
      downloadUrl,
      message: `Export prepared successfully. Found ${orders.length} orders.`,
      orderCount: orders.length,
      exportOptions,
      timestamp
    });

  } catch (error) {
    console.error('Error preparing export:', error);
    return NextResponse.json(
      { error: 'Failed to prepare export' },
      { status: 500 }
    );
  }
}
