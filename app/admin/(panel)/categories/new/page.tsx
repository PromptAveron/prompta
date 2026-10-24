import { AdminHeader } from '@/components/admin/admin-header'
import { CategoryForm } from '@/components/admin/category-form'

export default function NewCategoryPage() {
  return (
    <>
      <AdminHeader title="New category" />
      <CategoryForm />
    </>
  )
}
