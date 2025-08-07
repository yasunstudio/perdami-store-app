# Pickup Notification Scheduler Setup

## Overview
Sistem notifikasi pickup reminder otomatis untuk event Perdami 2025.

## Notification Types
- **PICKUP_REMINDER_H1**: Reminder H-1 sebelum pickup date
- **PICKUP_REMINDER_TODAY**: Reminder di hari pickup
- **PICKUP_READY**: Notifikasi order siap diambil (trigger manual)
- **PICKUP_COMPLETED**: Konfirmasi pickup berhasil (trigger manual)

## Automated Scheduling

### 1. Cron Jobs Setup (Production)

Add these to your server's crontab:

```bash
# H-1 Pickup Reminders - setiap hari jam 18:00
0 18 * * * cd /path/to/perdami-store-app && node scripts/pickup-scheduler.js h1-reminders >> /var/log/pickup-scheduler.log 2>&1

# Today Pickup Reminders - setiap hari jam 08:00
0 8 * * * cd /path/to/perdami-store-app && node scripts/pickup-scheduler.js today-reminders >> /var/log/pickup-scheduler.log 2>&1
```

### 2. Manual Commands

```bash
# Send H-1 reminders
node scripts/pickup-scheduler.js h1-reminders

# Send today reminders  
node scripts/pickup-scheduler.js today-reminders

# Send reminders for specific date
node scripts/pickup-scheduler.js date-reminders 2025-09-05
```

## Event Schedule Perdami 2025

### Event Dates: September 5-7, 2025
- **September 5**: Day 1 pickup
- **September 6**: Day 2 pickup  
- **September 7**: Day 3 pickup

### Notification Timeline Example:

**For September 5 pickup:**
- September 4, 18:00: H-1 reminder sent
- September 5, 08:00: Today reminder sent

**For September 6 pickup:**
- September 5, 18:00: H-1 reminder sent
- September 6, 08:00: Today reminder sent

**For September 7 pickup:**
- September 6, 18:00: H-1 reminder sent
- September 7, 08:00: Today reminder sent

## Manual Admin Controls

### Via Admin Panel
- Navigate to Admin Dashboard
- Access "Pickup Notification Management"
- Manual triggers available for testing

### Via API Endpoints
```bash
# Send H-1 reminders
POST /api/admin/pickup-notifications
{
  "action": "h1_reminders"
}

# Send today reminders
POST /api/admin/pickup-notifications
{
  "action": "today_reminders"
}

# Send for specific date
POST /api/admin/pickup-notifications
{
  "action": "reminders_for_date",
  "targetDate": "2025-09-05"
}

# Test notification for specific order
POST /api/admin/pickup-notifications
{
  "action": "test_notification",
  "orderId": "order-id-here"
}
```

## Notification Logic

### H-1 Reminders
- Target: Orders with pickup date = tomorrow
- Filters: orderStatus IN ['CONFIRMED', 'PROCESSING', 'READY']
- Condition: pickupStatus = 'NOT_PICKED_UP'

### Today Reminders  
- Target: Orders with pickup date = today
- Filters: orderStatus IN ['CONFIRMED', 'PROCESSING', 'READY']
- Condition: pickupStatus = 'NOT_PICKED_UP'

### Status-Based Notifications
- **PICKUP_READY**: Triggered when orderStatus changes to 'READY'
- **PICKUP_COMPLETED**: Triggered when pickupStatus changes to 'PICKED_UP'

## Monitoring & Logs

### Check Notification Stats
```bash
GET /api/admin/pickup-notifications?action=stats
```

Response:
```json
{
  "ordersForTomorrow": 45,
  "ordersForToday": 30, 
  "recentNotifications": 75,
  "lastUpdated": "2025-09-04T18:00:00Z"
}
```

### Log Files
- Application logs: Check console output
- Cron logs: `/var/log/pickup-scheduler.log`
- Database: `in_app_notifications` table

## Testing

### Pre-Event Testing (Recommended)
1. Create test orders with pickup dates
2. Use manual triggers to test notifications
3. Verify notifications appear in user accounts
4. Test notification bell and history

### Test Commands
```bash
# Test with current date + 1
node scripts/pickup-scheduler.js date-reminders $(date -d "+1 day" +%Y-%m-%d)

# Check notification stats via API
curl -X GET "http://localhost:3000/api/admin/pickup-notifications?action=stats"
```

## Troubleshooting

### Common Issues
1. **No notifications sent**: Check order status and pickup date filters
2. **Cron not running**: Verify cron service and permissions
3. **Database errors**: Check database connection and migrations

### Debug Commands
```bash
# Check orders for tomorrow
node -e "
const { prisma } = require('./src/lib/prisma');
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
prisma.order.findMany({
  where: { 
    pickupDate: { gte: tomorrow },
    pickupStatus: 'NOT_PICKED_UP'
  }
}).then(console.log);
"
```

## Security Notes
- Admin authentication required for all manual triggers
- Rate limiting applied to API endpoints
- Audit logs maintained for notification activities

## Performance Considerations
- Batch processing for large number of orders
- Async notification sending to prevent blocking
- Database indexes on pickupDate and status fields
