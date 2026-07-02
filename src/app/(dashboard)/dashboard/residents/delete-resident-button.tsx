"use client";

import { deleteResident } from "@/lib/actions/residents";
import { Button } from "@/components/ui";

export function DeleteResidentButton({ membershipId, name }: { membershipId: string; name: string }) {
  return (
    <form
      action={deleteResident.bind(null, membershipId)}
      onSubmit={(e) => {
        if (!confirm(`Remove ${name} as a resident? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        Delete
      </Button>
    </form>
  );
}
