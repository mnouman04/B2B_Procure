import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, Globe, Phone, Mail, Share2, Heart, MoreHorizontal,
  ShieldCheck, Truck, Clock, Package, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { messageApi, supplierApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, VerifiedBadge } from '../../components/ui/Badge.jsx';
import { Avatar, EmptyState, PageLoader, Rating } from '../../components/ui/Misc.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/**
 * Supplier Profile — header block with logo, name, verified chip, rating and
 * location; a tab strip; a facts row (founded / projects / employees /
 * compliance); then the two primary actions from the mockup.
 */
export const SupplierProfilePage = () => {
  const { t, locale, pick } = useI18n();
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [tab, setTab] = useState('about');
  const [contactOpen, setContactOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');

  const { data, loading } = useApi(() => supplierApi.profile(idOrSlug), [idOrSlug]);
  const startChat = useMutation((payload) => messageApi.start(payload));

  if (loading) return <PageLoader />;
  if (!data) return <EmptyState title={t('common.error')} />;

  const { supplier, products, reviews, completedOrders } = data;

  const tabs = [
    { key: 'about', label: t('suppliers.tabs.about') },
    { key: 'products', label: t('suppliers.tabs.products'), count: products?.length },
    { key: 'certifications', label: t('suppliers.tabs.certifications'), count: supplier.certifications?.length },
    { key: 'projects', label: t('suppliers.tabs.projects'), count: supplier.pastProjects?.length },
    { key: 'reviews', label: t('suppliers.tabs.reviews'), count: reviews?.length },
  ];

  const facts = [
    { label: t('suppliers.facts.founded'), value: supplier.foundedYear ?? '—' },
    { label: t('suppliers.facts.projects'), value: supplier.projectsCompleted ? `${supplier.projectsCompleted}+` : '—' },
    { label: t('suppliers.facts.employees'), value: supplier.employees ? `${supplier.employees}+` : '—' },
    { label: t('suppliers.facts.compliance'), value: `${supplier.complianceRate ?? 0}%` },
  ];

  const sendMessage = async () => {
    try {
      const res = await startChat.mutate({
        supplierId: supplier._id,
        subject: pick(supplier),
        body: messageBody,
      });
      toast.success(res.message);
      setContactOpen(false);
      setMessageBody('');
      navigate(`/${user.role}/messages`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8">
      <Card>
        {/* Header */}
        <div className="flex flex-wrap items-start gap-5 p-6">
          <Avatar src={supplier.logo} name={pick(supplier)} size={78} />

          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{pick(supplier)}</h1>
              {supplier.verified && <VerifiedBadge />}
            </div>
            <p className="mt-1 text-sm text-slate-500">{pick(supplier.primaryCategory)}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <Rating value={supplier.rating?.average} count={supplier.rating?.count} size="lg" />
              <span className="inline-flex items-center gap-1 text-[13px] text-slate-500">
                <MapPin size={14} />
                {supplier.location?.city}, {supplier.location?.country}
              </span>
              {supplier.contact?.website && (
                <a
                  href={supplier.contact.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] text-info hover:underline"
                >
                  <Globe size={14} />
                  {supplier.contact.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="soft" size="sm" icon={Heart} aria-label="Save" />
            <Button variant="soft" size="sm" icon={Share2}>
              {t('suppliers.share')}
            </Button>
            <Button variant="soft" size="sm" icon={MoreHorizontal} aria-label="More" />
          </div>
        </div>

        <div className="px-6">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="p-6">
          {tab === 'about' && (
            <>
              <p className="max-w-3xl text-[15px] leading-relaxed text-slate-600">
                {pick(supplier, 'about') || t('common.noData')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-card border border-line p-4 text-center">
                    <p className="text-xl font-extrabold tracking-tight text-ink">{f.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{f.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <InfoTile icon={Truck} label={t('suppliers.coverage')} value={(supplier.coverageAreas ?? []).join(', ') || '—'} />
                <InfoTile icon={Clock} label={t('suppliers.leadTime')} value={`${supplier.avgLeadTimeDays ?? 0} ${t('analytics.days')}`} />
                <InfoTile icon={ShieldCheck} label={t('analytics.onTime')} value={`${supplier.onTimeDeliveryRate ?? 0}%`} />
              </div>

              <div className="mt-6 flex flex-wrap gap-4 border-t border-line pt-5 text-sm text-slate-600">
                {supplier.contact?.phone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone size={15} className="text-slate-400" />
                    {supplier.contact.phone}
                  </span>
                )}
                {supplier.contact?.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail size={15} className="text-slate-400" />
                    {supplier.contact.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Package size={15} className="text-slate-400" />
                  {completedOrders} {t('analytics.orders')}
                </span>
              </div>
            </>
          )}

          {tab === 'products' && (
            products?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <div key={p._id} className="rounded-card border border-line p-4">
                    <p className="text-[15px] font-bold text-ink">{pick(p)}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] text-slate-500">{p.description}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <span className="text-[13px] font-semibold text-ink">
                        {p.priceFrom != null
                          ? `${t('common.currency')} ${formatMoney(p.priceFrom, { decimals: 0 })}${p.priceTo ? ` – ${formatMoney(p.priceTo, { decimals: 0 })}` : ''}`
                          : '—'}
                        <span className="ms-1 text-xs font-normal text-slate-400">/ {p.unit}</span>
                      </span>
                      <Badge tone="neutral" size="xs">{p.leadTimeDays} {t('analytics.days')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('suppliers.noProducts')} />
            )
          )}

          {tab === 'certifications' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(supplier.certifications ?? []).map((c) => (
                <div key={c.name} className="flex items-center gap-3 rounded-card border border-line p-4">
                  <ShieldCheck size={20} className="shrink-0 text-success" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.issuer} · {c.year}</span>
                  </span>
                </div>
              ))}
              {(supplier.documents ?? []).map((d) => (
                <div key={d.type} className="flex items-center gap-3 rounded-card border border-line p-4">
                  <ShieldCheck size={20} className="shrink-0 text-info" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{t(`verification.types.${d.type}`)}</span>
                    <span className="text-xs text-success">{t('status.verified')}</span>
                  </span>
                </div>
              ))}
              {!supplier.certifications?.length && !supplier.documents?.length && (
                <EmptyState title={t('common.noData')} className="sm:col-span-2" />
              )}
            </div>
          )}

          {tab === 'projects' && (
            supplier.pastProjects?.length ? (
              <div className="space-y-3">
                {supplier.pastProjects.map((p) => (
                  <div key={p.name} className="rounded-card border border-line p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[15px] font-bold text-ink">{p.name}</p>
                      {p.value && (
                        <p className="text-[13px] font-semibold text-slate-600">
                          {t('common.currency')} {formatMoney(p.value, { compact: true })}
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-slate-500">
                      {p.client} · {p.year}
                    </p>
                    {p.description && <p className="mt-2 text-[13px] text-slate-600">{p.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('common.noData')} />
            )
          )}

          {tab === 'reviews' && (
            reviews?.length ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="rounded-card border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Avatar src={r.company?.logo} name={pick(r.company)} size={32} />
                        <span className="text-sm font-bold text-ink">{pick(r.company)}</span>
                      </span>
                      <Rating value={r.rating} />
                    </div>
                    {r.title && <p className="mt-3 text-sm font-semibold text-ink">{r.title}</p>}
                    {r.comment && <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{r.comment}</p>}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-slate-500">
                      {['quality', 'delivery', 'communication', 'pricing'].map((k) => (
                        <span key={k} className="inline-flex items-center gap-1">
                          {t(`orders.rating.${k}`)}
                          <span className="inline-flex items-center gap-0.5 font-semibold text-ink">
                            <Star size={11} className="fill-gold-400 text-gold-400" />
                            {r.scores?.[k]}
                          </span>
                        </span>
                      ))}
                      <span className="ms-auto">{formatDate(r.createdAt, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('suppliers.noReviews')} />
            )
          )}
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3 border-t border-line px-6 py-5">
          <Button
            as={Link}
            to={`/buyer/rfqs/new?supplier=${supplier._id}`}
            size="lg"
            className="min-w-[220px] flex-1 sm:flex-none"
          >
            {t('suppliers.requestQuote')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[200px] flex-1 sm:flex-none"
            onClick={() => (user ? setContactOpen(true) : navigate('/login'))}
          >
            {t('suppliers.contact')}
          </Button>
        </div>
      </Card>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={t('messages.startConversation')}
        subtitle={pick(supplier)}
        footer={
          <>
            <Button variant="soft" onClick={() => setContactOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={sendMessage} loading={startChat.loading} disabled={!messageBody.trim()}>
              {t('messages.send')}
            </Button>
          </>
        }
      >
        <textarea
          rows={5}
          className="field resize-y"
          placeholder={t('messages.typeMessage')}
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
        />
      </Modal>
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-card border border-line p-4">
    <Icon size={18} className="mt-0.5 shrink-0 text-slate-400" />
    <span className="min-w-0">
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{value}</span>
    </span>
  </div>
);
