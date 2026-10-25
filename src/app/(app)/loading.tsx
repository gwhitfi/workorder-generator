export default function Loading() {
    return (
        <div className="flex justify-center py-24" role="status" aria-label="Loading">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        </div>
    );
}
