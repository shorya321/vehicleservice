import Link from "next/link"

export default function BlogNotFound() {
  return (
    <div className="bg-[var(--black-void)] min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <p className="t-label-accent mb-4">404</p>
        <h1 className="t-headline mb-4">Page Not Found</h1>
        <p className="t-body mb-8">
          The blog page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/blog"
          className="inline-flex px-6 py-2.5 text-[0.8125rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--onyx)] rounded-[4px] hover:bg-[var(--gold-deep)] transition-colors duration-300"
        >
          Back to Blog
        </Link>
      </div>
    </div>
  )
}
