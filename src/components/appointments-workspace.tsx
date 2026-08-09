"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  addAppointment,
  addHealthEvent,
  type AppointmentState,
} from "@/app/app/appointments/actions";

type Member = { id: string; full_name: string };
type Appointment = {
  id: string;
  starts_at: string;
  doctor_name: string | null;
  specialty: string | null;
  facility_name: string | null;
  purpose: string | null;
  follow_up_at: string | null;
  status: string;
  family_members: { full_name: string }[];
};
type Event = {
  id: string;
  occurred_at: string;
  title: string;
  type: string;
  notes: string | null;
  family_members: { full_name: string }[];
};
const initialAppointmentState: AppointmentState = {};

export function AppointmentsWorkspace({
  members,
  appointments,
  events,
}: {
  members: Member[];
  appointments: Appointment[];
  events: Event[];
}) {
  const [form, setForm] = useState<"appointment" | "event" | null>(null);
  const [appointmentState, appointmentAction, appointmentPending] =
    useActionState(addAppointment, initialAppointmentState);
  const [eventState, eventAction, eventPending] = useActionState(
    addHealthEvent,
    initialAppointmentState,
  );
  const timeline = [
    ...appointments.map((item) => ({
      id: item.id,
      at: item.starts_at,
      kind: "Appointment",
      title: item.purpose ?? "Appointment",
      detail: `${item.family_members[0]?.full_name ?? "Family member"}${item.doctor_name ? ` · ${item.doctor_name}` : ""}`,
    })),
    ...events.map((item) => ({
      id: item.id,
      at: item.occurred_at,
      kind: item.type.replace("_", " "),
      title: item.title,
      detail: item.family_members[0]?.full_name ?? "Family member",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[#e1eae2] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/app" className="text-sm font-bold text-[#27815b]">
            ← Back to CareLoop
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-[#4d9c73]">
            Health calendar
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#19332f]">
            Appointments & timeline
          </h1>
          <p className="mt-2 text-sm text-[#688077]">
            Track care visits and important health events in one chronological
            view.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setForm(form === "event" ? null : "event")}
            className="rounded-xl border border-[#d7e4da] bg-white px-4 py-3 text-sm font-semibold text-[#287354]"
          >
            + Health event
          </button>
          <button
            onClick={() =>
              setForm(form === "appointment" ? null : "appointment")
            }
            className="rounded-xl bg-[#1b7152] px-4 py-3 text-sm font-semibold text-white"
          >
            + Appointment
          </button>
        </div>
      </div>
      {members.length === 0 && (
        <p className="mt-6 rounded-2xl bg-[#fff5ec] p-4 text-sm text-[#946c5c]">
          Add a family profile before adding appointments or timeline events.
        </p>
      )}
      {form === "appointment" && members.length > 0 && (
        <section className="soft-card mt-6 rounded-3xl border border-[#e5ece6] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">New appointment</h2>
          <form
            action={appointmentAction}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <MemberSelect members={members} />
            <DateTimeField
              name="starts_at"
              label="Date & time"
              required
            />
            <Field
              name="purpose"
              label="Purpose"
              placeholder="Pediatric follow-up"
              required
            />
            <Field
              name="doctor_name"
              label="Doctor"
              placeholder="Dr. Saira Malik"
            />
            <Field
              name="specialty"
              label="Specialty"
              placeholder="Pediatrics"
            />
            <Field name="facility_name" label="Clinic or hospital" />
            <Field name="location" label="Location" />
            <DateTimeField
              name="follow_up_at"
              label="Follow-up date"
            />
            <label className="sm:col-span-2 text-sm font-bold">
              Notes
              <textarea
                name="notes"
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-[#dce7df] p-3 text-sm font-normal"
              />
            </label>
            <div className="sm:col-span-2">
              <Status state={appointmentState} />
              <button
                disabled={appointmentPending}
                className="mt-2 rounded-xl bg-[#1b7152] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {appointmentPending ? "Saving…" : "Save appointment"}
              </button>
            </div>
          </form>
        </section>
      )}
      {form === "event" && members.length > 0 && (
        <section className="soft-card mt-6 rounded-3xl border border-[#e5ece6] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Add health timeline event</h2>
          <p className="mt-1 text-xs text-[#71877f]">
            Keep notes factual and concise; this feature does not provide
            medical interpretation.
          </p>
          <form action={eventAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <MemberSelect members={members} />
            <label className="text-sm font-bold">
              Event type
              <select
                name="type"
                className="mt-1.5 w-full rounded-xl border border-[#dce7df] bg-white p-3 text-sm font-normal"
              >
                <option value="vaccination">Vaccination</option>
                <option value="symptom">Symptom note</option>
                <option value="health_note">Health note</option>
                <option value="other">Other event</option>
              </select>
            </label>
            <DateTimeField
              name="occurred_at"
              label="Date & time"
              required
            />
            <Field
              name="title"
              label="Title"
              placeholder="Routine vaccination"
              required
            />
            <label className="sm:col-span-2 text-sm font-bold">
              Notes
              <textarea
                name="notes"
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-[#dce7df] p-3 text-sm font-normal"
              />
            </label>
            <div className="sm:col-span-2">
              <Status state={eventState} />
              <button
                disabled={eventPending}
                className="mt-2 rounded-xl bg-[#1b7152] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {eventPending ? "Saving…" : "Add event"}
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="soft-card overflow-hidden rounded-3xl border border-[#e5ece6] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf1ed] px-5 py-4">
            <div>
              <h2 className="font-bold">Upcoming appointments</h2>
              <p className="mt-1 text-xs text-[#71877f]">Agenda view</p>
            </div>
            <span className="rounded-full bg-[#e8f4eb] px-2.5 py-1 text-xs font-bold text-[#27815b]">
              {appointments.length} total
            </span>
          </div>
          {appointments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-bold">Nothing on the calendar yet</p>
              <p className="mt-1 text-xs text-[#71877f]">
                Add an appointment to start your private health calendar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf1ed]">
              {appointments.map((item) => (
                <article key={item.id} className="flex gap-4 p-5">
                  <div className="w-12 rounded-xl bg-[#e8f2fc] py-2 text-center text-[#4b74ac]">
                    <p className="text-[10px] font-bold uppercase">
                      {new Intl.DateTimeFormat(undefined, {
                        month: "short",
                      }).format(new Date(item.starts_at))}
                    </p>
                    <p className="text-xl font-bold">
                      {new Date(item.starts_at).getDate()}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#25443d]">{item.purpose}</p>
                    <p className="mt-1 text-xs text-[#71877f]">
                      {item.family_members[0]?.full_name ?? "Family member"} ·{" "}
                      {item.doctor_name ?? "Provider to be added"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#547168]">
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(item.starts_at))}
                      {item.facility_name ? ` · ${item.facility_name}` : ""}
                    </p>
                    {item.follow_up_at && (
                      <p className="mt-2 text-[11px] font-bold text-[#a86a3e]">
                        Follow-up:{" "}
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                        }).format(new Date(item.follow_up_at))}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <aside className="soft-card rounded-3xl border border-[#e5ece6] bg-white p-5">
          <h2 className="text-lg font-bold">Health timeline</h2>
          <p className="mt-1 text-xs text-[#71877f]">
            Appointments and personal health events.
          </p>
          <div className="mt-5 space-y-5">
            {timeline.length === 0 ? (
              <p className="rounded-xl bg-[#f6f9f6] p-3 text-xs leading-5 text-[#71877f]">
                Your timeline will grow as you add appointments, medicines,
                documents, vaccinations, symptoms, and other events.
              </p>
            ) : (
              timeline.slice(0, 10).map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="border-l-2 border-[#cae5d2] pl-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#4d9c73]">
                    {item.kind}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#25443d]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-[#71877f]">
                    {item.detail} ·{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(item.at))}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
function MemberSelect({ members }: { members: Member[] }) {
  return (
    <label className="text-sm font-bold">
      Family member
      <select
        required
        name="family_member_id"
        className="mt-1.5 w-full rounded-xl border border-[#dce7df] bg-white p-3 text-sm font-normal"
      >
        <option value="">Select a profile</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-[#dce7df] p-3 text-sm font-normal"
      />
    </label>
  );
}

function DateTimeField({
  name,
  label,
  required = false,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const [utcValue, setUtcValue] = useState("");
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={`${name}_local`}
        type="datetime-local"
        required={required}
        onChange={(event) =>
          setUtcValue(
            event.currentTarget.value
              ? new Date(event.currentTarget.value).toISOString()
              : "",
          )
        }
        className="mt-1.5 w-full rounded-xl border border-[#dce7df] p-3 text-sm font-normal"
      />
      <input type="hidden" name={name} value={utcValue} />
    </label>
  );
}
function Status({ state }: { state: AppointmentState }) {
  return (
    <>
      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-[#fff0ec] px-3 py-2.5 text-xs text-[#a14f3b]"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-[#eaf6ed] px-3 py-2.5 text-xs text-[#23724e]"
        >
          {state.message}
        </p>
      )}
    </>
  );
}
