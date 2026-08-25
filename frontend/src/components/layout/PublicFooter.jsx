import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { Logo } from './Logo.jsx';

export const PublicFooter = () => {
  const { t } = useI18n();

  const columns = [
    {
      title: t('nav.forBuyers'),
      links: [
        { to: '/register', label: t('auth.registerCompany') },
        { to: '/suppliers', label: t('home.browseSuppliers') },
        { to: '/how-it-works', label: t('nav.howItWorks') },
        { to: '/pricing', label: t('nav.pricing') },
      ],
    },
    {
      title: t('nav.forSuppliers'),
      links: [
        { to: '/register/supplier', label: t('home.joinAsSupplier') },
        { to: '/how-it-works', label: t('nav.howItWorks') },
        { to: '/pricing', label: t('nav.pricing') },
      ],
    },
    {
      title: t('nav.resources'),
      links: [
        { to: '/how-it-works', label: t('nav.howItWorks') },
        { to: '/for-buyers', label: t('nav.forBuyers') },
      ],
    },
  ];

  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="mx-auto max-w-[1280px] px-5 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo theme="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t('home.heroSubtitle').replace('\n', ' ')}</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-gold-400" /> hello@procurio.sa
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-gold-400" /> +966 11 000 0000
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} className="text-gold-400" /> Riyadh, Saudi Arabia
              </li>
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold text-white">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.to}-${link.label}`}>
                    <Link to={link.to} className="text-sm transition hover:text-gold-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs">
          <p>© {new Date().getFullYear()} {t('brand.name')}. All rights reserved.</p>
          <p>{t('brand.tagline')}</p>
        </div>
      </div>
    </footer>
  );
};
