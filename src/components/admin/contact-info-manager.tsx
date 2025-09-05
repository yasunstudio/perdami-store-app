'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Mail, Phone, MessageCircle, MapPin, Facebook, Instagram, Twitter, Youtube, Edit2 } from 'lucide-react'
import { useContactInfo, ContactInfo } from '@/hooks/use-contact-info'

export function ContactInfoManager() {
  const router = useRouter()
  const { contactInfo, isLoading, fetchContactInfo } = useContactInfo()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEditContact = (contactId: string) => {
    router.push(`/admin/contact/${contactId}/edit`)
  }

  const getContactsByType = (type: string) => {
    return contactInfo.filter(item => item.type === type)
  }

  const getIconByType = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'PHONE': return <Phone className="h-4 w-4" />
      case 'WHATSAPP': return <MessageCircle className="h-4 w-4" />
      case 'SOCIAL_MEDIA': return <Facebook className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getColorByType = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
      case 'PHONE': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      case 'WHATSAPP': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      case 'SOCIAL_MEDIA': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const ContactCard = ({ contact }: { contact: ContactInfo }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIconByType(contact.type)}
          <span className="font-medium">{contact.title}</span>
        </div>
        <Badge className={getColorByType(contact.type)}>
          {contact.type}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground break-all">{contact.value}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Updated: {new Date(contact.updatedAt).toLocaleDateString('id-ID')}
        </span>
        <Button size="sm" variant="outline" onClick={() => handleEditContact(contact.id)}>
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Kontak
          </CardTitle>
          <CardDescription>
            Kelola alamat email untuk komunikasi dengan pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getContactsByType('EMAIL').map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phone Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Nomor Telepon
          </CardTitle>
          <CardDescription>
            Kelola nomor telepon untuk komunikasi dengan pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getContactsByType('PHONE').map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </CardTitle>
          <CardDescription>
            Kelola nomor WhatsApp untuk komunikasi dengan pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getContactsByType('WHATSAPP').map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Media Sosial
          </CardTitle>
          <CardDescription>
            Kelola tautan ke akun media sosial untuk ditampilkan di footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getContactsByType('SOCIAL_MEDIA').map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Informasi Kontak</CardTitle>
          <CardDescription>
            Total {contactInfo.length} item informasi kontak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getContactsByType('EMAIL').length}
              </div>
              <div className="text-sm text-muted-foreground">Email</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {getContactsByType('PHONE').length}
              </div>
              <div className="text-sm text-muted-foreground">Telepon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {getContactsByType('WHATSAPP').length}
              </div>
              <div className="text-sm text-muted-foreground">WhatsApp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {getContactsByType('SOCIAL_MEDIA').length}
              </div>
              <div className="text-sm text-muted-foreground">Media Sosial</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
