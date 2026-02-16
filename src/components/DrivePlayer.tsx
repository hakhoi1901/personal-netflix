'use client';

interface DrivePlayerProps {
    driveId: string;
}

/**
 * DrivePlayer embeds a Google Drive video using an iframe with the /preview endpoint.
 *
 * Why iframe instead of <video> tag?
 * Google Drive redirects large files through a virus-scan interstitial page,
 * which breaks the HTML5 <video> element. The iframe /preview approach handles
 * this seamlessly and provides Google's built-in player controls.
 */
export default function DrivePlayer({ driveId }: DrivePlayerProps) {
    // Construct the Google Drive preview URL from the file ID
    const streamUrl = `https://drive.google.com/file/d/${driveId}/preview`;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <iframe
                src={streamUrl}
                title="Video Player"
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups"
            />
        </div>
    );
}
