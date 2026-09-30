export default function WorkOrderNotFound() {
    return (
        <main className="mx-auto max-w-md px-4 py-24 text-center text-neutral-100">
            <h1 className="text-2xl font-semibold">Work order not available</h1>
            <p className="mt-4 text-neutral-400">
                This work order link isn&apos;t available. It may have been cancelled, replaced with a new link, or
                not sent yet.
            </p>
            <p className="mt-4 text-neutral-400">Contact the office that sent it to you.</p>
        </main>
    );
}
