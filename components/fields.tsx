"use client";

import { useState, type ReactNode } from "react";

// Um prefixo por formulário evita ids repetidos quando a página tem
// vários formulários da mesma entidade (um de criação e um por linha).

type TextFieldProps = {
  label: string;
  name: string;
  idPrefix?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "email" | "date" | "search";
  required?: boolean;
  maxLength?: number;
  error?: string;
};

export function TextField({
  label,
  name,
  idPrefix = "",
  defaultValue,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  error,
}: TextFieldProps) {
  const inputId = idPrefix + name;

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="input"
        id={inputId}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}

export function TextareaField({
  label,
  name,
  idPrefix = "",
  defaultValue,
  placeholder,
  rows = 4,
  maxLength,
  error,
}: {
  label: string;
  name: string;
  idPrefix?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
}) {
  const inputId = idPrefix + name;

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        className="textarea"
        id={inputId}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  idPrefix = "",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  idPrefix?: string;
  defaultValue?: string;
  error?: string;
}) {
  const inputId = idPrefix + name;

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <select className="select" id={inputId} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}

export function ColorField({
  label,
  name,
  idPrefix = "",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  idPrefix?: string;
  defaultValue: string;
  error?: string;
}) {
  const inputId = idPrefix + name;
  const [color, setColor] = useState(defaultValue);

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          className="h-9 w-14 cursor-pointer border border-line-strong bg-bg p-0"
          id={inputId}
          name={name}
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
        <span className="text-[11px] text-faint">{color}</span>
      </div>
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  children,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  children?: ReactNode;
}) {
  return (
    <label className="checkbox">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="field-error" id={id}>
      {message}
    </p>
  );
}
