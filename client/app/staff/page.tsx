import { redirect } from "next/navigation";

export default function StaffIndexRedirect() {
  redirect("/staff/appointments");
}
