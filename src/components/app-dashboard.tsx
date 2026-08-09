import Link from "next/link";

type Appointment = { id: string; starts_at: string; purpose: string | null; doctor_name: string | null; family_members: { full_name: string }[] };

export function AppDashboard({
  userName,
  household,
  memberCount,
  medicineCount,
  documentCount,
  upcomingAppointments,
}: {
  userName: string;
  household: { name: string } | null;
  memberCount: number;
  medicineCount: number;
  documentCount: number;
  upcomingAppointments: Appointment[];
}) {
  const cards = [
    { href: "/app/family", label: "Family", value: `${memberCount} profiles`, detail: "Add and manage the people in your household." },
    { href: "/app/medicines", label: "Medicines", value: `${medicineCount} active`, detail: "Keep schedules, logs, and refill dates together." },
    { href: "/app/appointments", label: "Appointments", value: `${upcomingAppointments.length} upcoming`, detail: "Track visits, follow-ups, and health events." },
    { href: "/app/documents", label: "Documents", value: `${documentCount} records`, detail: "Upload and keep private medical records organized." },
    { href: "/app/emergency", label: "Emergency", value: "Profiles & QR cards", detail: "Prepare opt-in emergency details for quick access." },
    { href: "/app/settings", label: "Settings", value: "Privacy controls", detail: "Manage profile details, reminders, exports, and deletion requests." },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-[#e1eae2] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#4d9c73]">CareLoop dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#19332f]">Welcome, {userName}</h1>
          <p className="mt-2 text-sm text-[#688077]">Your family&apos;s private care space, organized around what matters today.</p>
        </div>
        <Link href="/app/family" className="rounded-xl bg-[#1b7152] px-4 py-3 text-center text-sm font-semibold text-white">{household ? "Manage household" : "Create household"}</Link>
      </header>

      {!household ? (
        <section className="mt-7 rounded-3xl border border-[#d4e6d8] bg-[#edf7ef] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#36825c]">Start here</p>
          <h2 className="mt-2 text-2xl font-bold text-[#19332f]">Create your private household</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#527266]">Your household is the secure boundary for family profiles, medicines, appointments, documents, and emergency details. Nothing is shared until you explicitly invite a caregiver.</p>
          <Link href="/app/family" className="mt-5 inline-flex rounded-xl bg-[#1b7152] px-4 py-3 text-sm font-bold text-white">Create household</Link>
        </section>
      ) : (
        <>
          <section className="mt-7 rounded-3xl bg-[#193e33] p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#b9d9cb]">{household.name}</p>
            <h2 className="mt-2 text-2xl font-bold">Your care space is ready.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c8ded3]">Use the cards below to manage only the information you choose to store. CareLoop does not provide medical diagnosis, treatment, or emergency advice.</p>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link key={card.href} href={card.href} className="soft-card rounded-3xl border border-[#e5ece6] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b9d8c2]">
                <p className="text-xs font-bold uppercase tracking-[.1em] text-[#4d9c73]">{card.label}</p>
                <p className="mt-3 text-xl font-bold text-[#25443d]">{card.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#71877f]">{card.detail}</p>
              </Link>
            ))}
          </section>

          <section className="soft-card mt-6 rounded-3xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-[#19332f]">Upcoming appointments</h2><p className="mt-1 text-xs text-[#71877f]">Your next personal care events.</p></div><Link href="/app/appointments" className="text-xs font-bold text-[#27815b]">Open calendar →</Link></div>
            {upcomingAppointments.length === 0 ? <p className="mt-5 rounded-xl bg-[#f6f9f6] p-4 text-sm text-[#71877f]">No upcoming appointments yet. Add one when you&apos;re ready.</p> : <div className="mt-5 divide-y divide-[#edf1ed]">{upcomingAppointments.map((appointment) => <div key={appointment.id} className="py-4 first:pt-0"><p className="font-bold text-[#25443d]">{appointment.purpose ?? "Appointment"}</p><p className="mt-1 text-xs text-[#71877f]">{appointment.family_members[0]?.full_name ?? "Family member"}{appointment.doctor_name ? ` · ${appointment.doctor_name}` : ""} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.starts_at))}</p></div>)}</div>}
          </section>
        </>
      )}
    </main>
  );
}
