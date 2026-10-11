import { APP_STORE_URL, PLAY_STORE_URL } from "../lib/appStores";

/**
 * "Download on the App Store" / "Get it on Google Play" buttons.
 *
 * Drawn here rather than shipped as image files so they stay crisp at any size and pick up
 * the site font. They follow the stores' own badge layout (logo, small caption, store name
 * on black) so visitors recognise them at a glance. Black with a faint white hairline reads
 * on every background the site uses: white, slate, the blue CTA and the dark app theme.
 */

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayLogo({ className }: { className?: string }) {
  // The four-colour Play triangle: blue left, green top, yellow tip, red bottom.
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Z" />
      <path fill="#34A853" d="M3.6 1.8c.4-.2.9-.2 1.4.1l11.5 6.6-3.1 3.5L3.6 1.8Z" />
      <path fill="#FBBC04" d="m16.5 8.5 3.6 2.1c1 .6 1 2.2 0 2.8l-3.6 2.1-3.1-3.5 3.1-3.5Z" />
      <path fill="#EA4335" d="m13.4 12 3.1 3.5L5 22.1c-.5.3-1 .3-1.4.1L13.4 12Z" />
    </svg>
  );
}

type Size = "md" | "lg";

const SIZES: Record<Size, { box: string; logo: string; caption: string; name: string }> = {
  md: { box: "h-11 pl-3 pr-4 gap-2 rounded-[10px]", logo: "w-6 h-6", caption: "text-[9px]", name: "text-[17px]" },
  lg: { box: "h-14 pl-4 pr-5 gap-2.5 rounded-xl", logo: "w-7 h-7", caption: "text-[11px]", name: "text-[21px]" },
};

function Badge({
  href,
  label,
  caption,
  name,
  logo,
  size,
  onClick,
}: {
  href: string;
  label: string;
  caption: string;
  name: string;
  logo: React.ReactNode;
  size: Size;
  onClick?: () => void;
}) {
  const s = SIZES[size];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center ${s.box} bg-black text-white border border-white/20 shadow-sm hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pj-blue-400 focus-visible:ring-offset-2`}
    >
      <span className={`${s.logo} shrink-0 flex items-center justify-center`}>{logo}</span>
      <span className="flex flex-col items-start leading-none text-left">
        <span className={`${s.caption} font-medium tracking-wide opacity-90`}>{caption}</span>
        <span className={`${s.name} font-semibold tracking-tight mt-0.5`}>{name}</span>
      </span>
    </a>
  );
}

export function AppStoreBadge({ size = "md", onClick }: { size?: Size; onClick?: () => void }) {
  return (
    <Badge
      href={APP_STORE_URL}
      label="Download PocketJobs on the App Store"
      caption="Download on the"
      name="App Store"
      logo={<AppleLogo className="w-full h-full" />}
      size={size}
      onClick={onClick}
    />
  );
}

export function PlayStoreBadge({ size = "md", onClick }: { size?: Size; onClick?: () => void }) {
  return (
    <Badge
      href={PLAY_STORE_URL}
      label="Get PocketJobs on Google Play"
      caption="GET IT ON"
      name="Google Play"
      logo={<PlayLogo className="w-full h-full" />}
      size={size}
      onClick={onClick}
    />
  );
}

/** Both badges side by side, wrapping on narrow screens. */
export default function StoreBadges({
  size = "md",
  className = "",
  onClick,
}: {
  size?: Size;
  className?: string;
  /** Fired when either store is opened, e.g. so the download prompt stops asking. */
  onClick?: () => void;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <AppStoreBadge size={size} onClick={onClick} />
      <PlayStoreBadge size={size} onClick={onClick} />
    </div>
  );
}
