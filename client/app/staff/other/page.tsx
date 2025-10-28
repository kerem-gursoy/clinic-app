<<<<<<< HEAD
import { notFound } from "next/navigation"

export default function StaffOtherPage() {
  return notFound()
=======
import { EmptyState } from "@/components/empty-state"
import { Inbox } from "lucide-react"

export default function StaffOtherPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <EmptyState icon={Inbox} title="Coming Soon" description="Additional features will be available here." />
    </div>
  )
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
}
