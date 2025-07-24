import { ContactInfoFormPage } from '@/features/admin/contact-info/components/contact-info-form-page'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditContactInfoPage({ params }: Props) {
  const { id } = await params
  return <ContactInfoFormPage contactInfoId={id} />
}
