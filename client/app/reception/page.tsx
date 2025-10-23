import { redirect } from "next/navigation";

export default function ReceptionIndexRedirect() {
  redirect("/reception/appointments");
}
