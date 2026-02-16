import WatchClient from './WatchClient';

/**
 * Required for static export (output: 'export').
 * Returns a placeholder so Next.js generates an HTML shell.
 * The actual movie ID is resolved client-side via useParams().
 */
export function generateStaticParams() {
    return [{ id: 'placeholder' }];
}

export default function WatchPage() {
    return <WatchClient />;
}
