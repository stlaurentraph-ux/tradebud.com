"use client";

import { Mail, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, type Locale } from "@/i18n.config";

function isHomePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment !== undefined && locales.includes(segment as Locale) && pathname.split("/").filter(Boolean).length === 1;
}

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const pathname = usePathname();
  const homePath = `/${locale}`;
  const waitlist = useWaitlistDialog();

  const resolvedHref = (hash: string) => (isHomePath(pathname) ? hash : `${homePath}${hash}`);

  return (
    <>
      <footer className="bg-[var(--warm-stone)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <Link href={homePath} className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/images/tracebud-logo.png" alt="Tracebud" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-[var(--forest-canopy)]">Tracebud</span>
            </Link>

            <div className="flex flex-wrap gap-8">
              <Link href={resolvedHref("#how-it-works")} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("howItWorks")}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("privacy")}
              </Link>
              <Link href={`/${locale}/terms`} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("terms")}
              </Link>
              <a href="mailto:hello@tracebud.com" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("contact")}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="mailto:hello@tracebud.com"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Tracebud. {t("tagline")}
            </p>
          </div>
        </div>
      </footer>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
