import { redirect } from "next/navigation";

// Legacy redirect → use /{orgSlug}/menu/parcel
export default function LegacyParcelPage() {
  redirect("/my-hotel/menu/parcel");
}
