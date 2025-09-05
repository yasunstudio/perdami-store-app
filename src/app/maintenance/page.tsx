import { MaintenancePage } from '@/components/maintenance'
import { getMaintenanceMessage } from '@/lib/maintenance'

export default async function Maintenance() {
  const message = await getMaintenanceMessage()
  
  return <MaintenancePage message={message} />
}
