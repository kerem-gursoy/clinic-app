import { EmptyState } from "@/components/empty-state"
import { Inbox } from "lucide-react"

export default function DoctorOtherPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <EmptyState icon={Inbox} title="Coming Soon" description="Additional features will be available here." />
    </div>
  )
}
