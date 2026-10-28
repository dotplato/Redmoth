import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-1 items-center py-12">
      <div className="container-page flex flex-col items-center text-center">
        {/* The art sits on an off-white canvas; multiply drops that into the page background. */}
        <Image
          src="/images/404-moths.png"
          width={900}
          height={700}
          alt="Three sleeping stone numbers spelling 404, with red moths fluttering away above them."
          sizes="(min-width: 640px) 480px, 90vw"
          loading="eager"
          fetchPriority="high"
          className="h-auto w-full max-w-[480px] mix-blend-multiply"
        />
        <p className="eyebrow mt-4">Error 404</p>
        <h1 className="font-display mt-3 text-5xl leading-none sm:text-6xl">This page flew away.</h1>
        <p className="mt-4 max-w-md text-lg leading-8 text-[var(--muted)]">
          It doesn&rsquo;t exist. The listing may have been unpublished, or the link is mistyped.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/tools" className="btn btn-primary btn-lg">
            Discover apps
          </Link>
          <Link href="/" className="btn btn-outline btn-lg">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
