import Link from 'next/link';

interface FooterItemProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function FooterItem({ label, value }: FooterItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white-400/70">{label}</span>
      <span className="text-accent">{value}</span>
    </div>
  );
}

function FooterSeparator() {
  return <span className="text-white-400/70">•</span>;
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <Link href={href} className="text-white-400 hover:text-white-300 transition-colors">
      {children}
    </Link>
  );
}

export function DashboardFooter() {
  return (
    <div className="border">
      <div className="mx-auto px-4 py-3">
        <div className="flex gap-8 text-xs justify-between">
          <div className="flex gap-2">
            <FooterItem label="©" value="2025 AUBRAI" />

            <FooterItem label="Treasury" value="0xTREA5...sure" valueClassName="font-mono" />

            <FooterItem label="Contract" value="0xC0N7...tract" valueClassName="font-mono" />
          </div>
          <div className="flex gap-2">
            <FooterItem label="Built on" value="Base" />

            <FooterSeparator />

            <FooterLink href="/docs">Docs</FooterLink>

            <FooterSeparator />

            <FooterLink href="/privacy">Privacy</FooterLink>
          </div>
        </div>
      </div>
    </div>
  );
}
