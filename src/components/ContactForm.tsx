"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { contactRequestSchema } from "@/lib/contact";
import { useLocale } from "./LocaleProvider";

type FieldName = "name" | "email" | "label" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "sending" | "success" | "error";

type ContactValues = Record<FieldName, string>;

const inputClassName =
  "mt-2 w-full rounded-lg border border-line bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

function initialValues(labels: string[]): ContactValues {
  return {
    name: "",
    email: "",
    label: labels[0] ?? "",
    message: "",
  };
}

type ContactFormProps = {
  labels: string[];
};

export function ContactForm({ labels }: ContactFormProps) {
  const { t } = useLocale();
  const formId = useId();
  const [values, setValues] = useState<ContactValues>(() =>
    initialValues(labels),
  );
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate(): FieldErrors {
    const result = contactRequestSchema.safeParse(values);

    if (result.success) {
      return {};
    }

    const next: FieldErrors = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];

      if (
        field === "name" ||
        field === "email" ||
        field === "label" ||
        field === "message"
      ) {
        next[field] = t.contact.errors[field];
      }
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, company }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setValues(initialValues(labels));
      setCompany("");
    } catch {
      setStatus("error");
    }
  }

  function describedBy(field: FieldName) {
    return errors[field] ? `${formId}-${field}-error` : undefined;
  }

  function handleChange(
    field: FieldName,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    updateField(field, event.target.value);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="mt-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-name`} className="text-sm font-medium">
            {t.contact.name}
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            value={values.name}
            onChange={(event) => handleChange("name", event)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            disabled={status === "sending"}
            className={inputClassName}
          />
          {errors.name ? (
            <p
              id={`${formId}-name-error`}
              className="mt-1.5 text-sm text-danger"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-email`} className="text-sm font-medium">
            {t.contact.email}
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            value={values.email}
            onChange={(event) => handleChange("email", event)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            disabled={status === "sending"}
            className={inputClassName}
          />
          {errors.email ? (
            <p
              id={`${formId}-email-error`}
              className="mt-1.5 text-sm text-danger"
            >
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`${formId}-label`} className="text-sm font-medium">
          {t.contact.label}
        </label>
        <select
          id={`${formId}-label`}
          name="label"
          required
          value={values.label}
          onChange={(event) => handleChange("label", event)}
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={describedBy("label")}
          disabled={status === "sending"}
          className={inputClassName}
        >
          {labels.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        {errors.label ? (
          <p id={`${formId}-label-error`} className="mt-1.5 text-sm text-danger">
            {errors.label}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor={`${formId}-message`} className="text-sm font-medium">
          {t.contact.message}
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          value={values.message}
          onChange={(event) => handleChange("message", event)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message")}
          disabled={status === "sending"}
          className={`${inputClassName} resize-y`}
        />
        {errors.message ? (
          <p
            id={`${formId}-message-error`}
            className="mt-1.5 text-sm text-danger"
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor={`${formId}-company`}>Company</label>
        <input
          id={`${formId}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status === "sending" ? t.contact.sending : t.contact.submit}
        </button>

        {status === "success" ? (
          <p role="status" className="text-sm text-primary-text">
            {t.contact.success}
          </p>
        ) : null}
        {status === "error" ? (
          <p role="alert" className="text-sm text-danger">
            {t.contact.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
