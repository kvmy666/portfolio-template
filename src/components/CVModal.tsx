"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type RefObject,
} from "react";

import { useLocale } from "./LocaleProvider";

type CVModalProps = {
  file: string;
  downloadFile?: string | null;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  onClose?: () => void;
};

export function CVModal({
  file,
  downloadFile,
  triggerRef,
  onClose,
}: CVModalProps) {
  const { t } = useLocale();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleClose() {
    onClose?.();
    triggerRef?.current?.focus();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const rect = dialog.getBoundingClientRect();
    const insideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!insideDialog) {
      closeDialog();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="cv-dialog"
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      <div className="cv-dialog-panel">
        <div className="cv-dialog-header">
          <h3 id={titleId} className="text-lg font-semibold">
            {t.cv.title}
          </h3>
          <button
            type="button"
            onClick={closeDialog}
            aria-label={t.cv.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-xl leading-none text-muted transition hover:border-accent/40 hover:text-primary-text"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="cv-dialog-preview">
          <iframe
            title={t.cv.preview}
            src={file}
            className="h-full w-full border-0 bg-white"
          />
        </div>

        <div className="cv-dialog-actions">
          <a
            href={downloadFile ?? file}
            download
            className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition hover:-translate-y-0.5"
          >
            {t.cv.download}
          </a>
          <a
            href={file}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full border border-line bg-background px-5 py-3 text-sm font-semibold transition hover:border-accent/40 hover:text-primary-text"
          >
            {t.cv.openInNewTab}
            <span aria-hidden="true"> ↗</span>
          </a>
        </div>
      </div>
    </dialog>
  );
}
