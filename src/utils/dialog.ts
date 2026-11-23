/**
 * Closes a modal dialog only when the user clicks directly on its backdrop
 * rather than interacting with nested controls (e.g. native <select> popups).
 */
export function bindDialogBackdropClose(dialog: HTMLDialogElement): void {
  if (dialog.dataset.backdropBound === 'true') return;
  dialog.dataset.backdropBound = 'true';

  let pointerDownOnBackdrop = false;

  const isBackdropEvent = (event: MouseEvent): boolean => {
    if (event.target !== dialog) return false;
    // Native <select> popups and keyboard activations often emit (0, 0) coordinates.
    if (event.clientX === 0 && event.clientY === 0) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };

  dialog.addEventListener('pointerdown', (event) => {
    pointerDownOnBackdrop = event.button === 0 && isBackdropEvent(event);
  });

  dialog.addEventListener('click', (event) => {
    if (pointerDownOnBackdrop && isBackdropEvent(event)) {
      dialog.close();
    }
    pointerDownOnBackdrop = false;
  });
}
