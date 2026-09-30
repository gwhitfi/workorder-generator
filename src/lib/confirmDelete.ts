export const DELETE_NOT_CONFIRMED = { ok: false, error: 'Type "yes" to confirm.' } as const;

export function isDeleteConfirmed(confirmation: string) {
    return confirmation.trim().toLowerCase() === "yes";
}
