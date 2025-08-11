'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Globe,
  Linkedin,
  Edit,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { ContactInfo } from '../types/contact-info.types'

interface ContactInfoCardProps {
  contactInfo: ContactInfo
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

const ICONS = {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Linkedin
}

export function ContactInfoCard({ contactInfo, onEdit, onDelete, isDeleting = false }: ContactInfoCardProps) {
  const getIcon = (iconName: string) => {
    const Icon = ICONS[iconName as keyof typeof ICONS]
    return Icon ? <Icon className="h-4 w-4" /> : <Mail className="h-4 w-4" />
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      EMAIL: 'Email',
      PHONE: 'Telepon',
      WHATSAPP: 'WhatsApp',
      ADDRESS: 'Alamat',
      SOCIAL_MEDIA: 'Media Sosial'
    }
    return typeMap[type] || type
  }

  const isUrl = (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const handleValueClick = () => {
    if (contactInfo.type === 'EMAIL') {
      window.open(`mailto:${contactInfo.value}`, '_blank')
    } else if (contactInfo.type === 'PHONE') {
      window.open(`tel:${contactInfo.value}`, '_blank')
    } else if (contactInfo.type === 'WHATSAPP') {
      window.open(`https://wa.me/${contactInfo.value}`, '_blank')
    } else if (isUrl(contactInfo.value)) {
      window.open(contactInfo.value, '_blank')
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-5 h-full">
        <div className="flex flex-col h-full space-y-4">
          {/* Header with icon, title, and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-2 rounded-full bg-muted">
                  {getIcon(contactInfo.icon)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 truncate">{contactInfo.title}</h3>
                <Badge className={`text-xs w-fit ${getColorClass(contactInfo.color)}`}>
                  {getTypeLabel(contactInfo.type)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(contactInfo.id)}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                title="Edit kontak"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(contactInfo.id)}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Hapus kontak"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Contact value section */}
          <div className="flex-1">
            <div className="group">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                Nilai Kontak
              </label>
              <p 
                className={`text-sm font-medium break-words leading-relaxed ${
                  (contactInfo.type === 'EMAIL' || contactInfo.type === 'PHONE' || 
                   contactInfo.type === 'WHATSAPP' || isUrl(contactInfo.value)) 
                    ? 'cursor-pointer hover:text-primary hover:underline text-blue-600' 
                    : 'text-foreground'
                }`}
                onClick={handleValueClick}
                title={contactInfo.value}
              >
                {contactInfo.value}
                {(contactInfo.type === 'SOCIAL_MEDIA' && isUrl(contactInfo.value)) && (
                  <ExternalLink className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </p>
            </div>
          </div>
          
          {/* Footer with date */}
          <div className="mt-auto pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Dibuat pada</span>
              <span className="font-medium">
                {new Date(contactInfo.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
