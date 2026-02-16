// Force dynamic rendering since the layout uses client-side Firebase Auth
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">404</h1>
                <p className="text-zinc-400">Page not found</p>
            </div>
        </div>
    );
}
