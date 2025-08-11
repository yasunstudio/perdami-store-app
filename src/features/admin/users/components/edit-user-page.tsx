'use client'

import { UserFormPage } from './user-form-page'

interface EditUserPageProps {
  userId: string
}

export function EditUserPage({ userId }: EditUserPageProps) {
  return <UserFormPage mode="edit" userId={userId} />
}
