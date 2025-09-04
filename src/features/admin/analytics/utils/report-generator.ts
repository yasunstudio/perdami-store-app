import { ReportData, StoreReportData, ExportOptions } from '../types';

export class ReportGenerator {
  static generateSummary(data: ReportData): any {
    return {
      totalOrders: data.summary.totalOrders,
      totalValue: data.summary.totalValue,
      averageOrderValue: data.summary.averageOrderValue,
      storeCount: data.summary.storeCount,
      topStore: data.storeBreakdown[0]?.store.name || 'N/A',
      topProduct: data.topProducts[0]?.productName || 'N/A'
    };
  }

  static generateDetailedReport(data: ReportData): any {
    return {
      summary: this.generateSummary(data),
      storeBreakdown: data.storeBreakdown,
      productAnalysis: data.topProducts,
      timeAnalysis: data.timeAnalysis
    };
  }

  static generatePackingList(data: ReportData): any {
    const packingItems: any = {};
    
    data.storeBreakdown.forEach(store => {
      store.orders.forEach(order => {
        order.items.forEach(item => {
          const key = `${item.productId}_${store.store.id}`;
          if (!packingItems[key]) {
            packingItems[key] = {
              storeName: store.store.name,
              productName: item.productName,
              totalQuantity: 0,
              orders: []
            };
          }
          packingItems[key].totalQuantity += item.quantity;
          packingItems[key].orders.push({
            orderId: order.id,
            customerName: order.customerName,
            quantity: item.quantity
          });
        });
      });
    });

    return Object.values(packingItems);
  }

  static calculateStatistics(data: ReportData): any {
    const totalRevenue = data.summary.totalValue;
    const totalOrders = data.summary.totalOrders;
    const storeCount = data.summary.storeCount;

    return {
      revenue: {
        total: totalRevenue,
        average: totalRevenue / storeCount,
        highest: Math.max(...data.storeBreakdown.map(s => s.metrics.totalValue)),
        lowest: Math.min(...data.storeBreakdown.map(s => s.metrics.totalValue))
      },
      orders: {
        total: totalOrders,
        average: totalOrders / storeCount,
        highest: Math.max(...data.storeBreakdown.map(s => s.metrics.totalOrders)),
        lowest: Math.min(...data.storeBreakdown.map(s => s.metrics.totalOrders))
      },
      performance: {
        topStores: data.storeBreakdown.slice(0, 5),
        topProducts: data.topProducts.slice(0, 10),
        peakHours: data.timeAnalysis.peakHours
      }
    };
  }
}
