import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { Inbox, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { orderApi, rfqApi } from '../../api/endpoints.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, PageLoader, Rating } from '../../components/ui/Misc.jsx';
import { formatMoney } from '../../utils/format.js';

/**
 * Compare Quotations.
 *
 * A specification-versus-supplier matrix: rows are comparison criteria,
 * columns are suppliers. The winning cell in each row is tinted green and
 * carries a badge (Best Price / Best Match / Fastest), and the leading column
 * gets a soft green wash — exactly as the mockup shows.
 */
export const CompareQuotationsPage = () => {
  const { t, pick } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [awarding, setAwarding] = useState(null);

  const { data, loading, refresh } = useApi(() => rfqApi.comparison(id), [id]);
  const award = useMutation((quotationId) => orderApi.issue({ quotationId }));

  if (loading) return <PageLoader />;

  const rfq = data?.rfq;
  const quotes = data?.quotations ?? [];
  const summary = data?.summary;

  if (!quotes.length) {
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{t('compare.title')}</h1>
          {rfq && <span className="text-sm font-semibold text-slate-500">RFQ: <span className="text-info">{rfq.rfqNumber}</span></span>}
        </div>
        <EmptyState icon={Inbox} title={t('compare.noQuotes')} />
      </Card>
    );
  }

  const best = quotes[0];
  const badgeOf = (quote, badge) => quote.badges?.includes(badge);

  /** Renders one comparison row; `winner` decides which cell is highlighted. */
  const Row = ({ label, render, winner, badge }) => (
    <tr className="border-b border-line last:border-0">
      <th className="w-[220px] border-e border-line bg-white px-4 py-3.5 text-start text-[13px] font-medium text-slate-600">
        {label}
      </th>
      {quotes.map((quote) => {
        const isWinner = winner?.(quote);
        return (
          <td
            key={quote._id}
            className={clsx(
              'border-e border-line px-4 py-3.5 text-center last:border-0',
              quote._id === best._id && 'bg-success-soft/50',
            )}
          >
            <span
              className={clsx(
                'inline-flex items-center gap-2 text-[15px] font-semibold',
                isWinner ? 'text-success' : 'text-ink',
              )}
            >
              {render(quote)}
              {isWinner && badge && (
                <Badge tone="success" size="xs">{t(`compare.badges.${badge}`)}</Badge>
              )}
            </span>
          </td>
        );
      })}
    </tr>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{t('compare.title')}</h1>
            {summary?.potentialSavings > 0 && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-success">
                <TrendingDown size={14} />
                {t('compare.potentialSavings')}: {t('common.currency')}{' '}
                {formatMoney(summary.potentialSavings, { decimals: 0 })}
              </p>
            )}
          </div>
          {rfq && (
            <Link to={`/buyer/rfqs/${rfq._id}`} className="text-sm font-semibold text-slate-500 hover:text-ink">
              RFQ: <span className="text-info">{rfq.rfqNumber}</span>
            </Link>
          )}
        </div>

        <div className="scroll-x border-t border-line">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-[220px] border-e border-line px-4 py-5 text-start text-[13px] font-semibold text-slate-600">
                  {t('compare.itemsSpecs')}
                </th>
                {quotes.map((quote) => (
                  <th
                    key={quote._id}
                    className={clsx(
                      'border-e border-line px-4 py-5 text-center last:border-0',
                      quote._id === best._id && 'bg-success-soft/50',
                    )}
                  >
                    <p className="text-[15px] font-bold text-ink">{pick(quote.supplier)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{quote.supplier?.location?.city}</p>
                    <Button
                      as={Link}
                      to={`/suppliers/${quote.supplier?.slug || quote.supplier?._id}`}
                      size="xs"
                      variant="soft"
                      className="mt-2.5"
                    >
                      {t('compare.viewProfile')}
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <Row
                label={t('compare.totalPrice', { currency: t('common.currency') })}
                render={(q) => formatMoney(q.totalPrice)}
                winner={(q) => badgeOf(q, 'best_price')}
                badge="best_price"
              />
              <Row
                label={t('compare.matchScore')}
                render={(q) => `${q.matchScore}%`}
                winner={(q) => badgeOf(q, 'best_match')}
                badge="best_match"
              />
              <Row
                label={t('compare.deliveryTime')}
                render={(q) => t('compare.days', { n: q.deliveryDays })}
                winner={(q) => badgeOf(q, 'fastest')}
                badge="fastest"
              />
              <Row
                label={t('compare.qualityCompliance')}
                render={(q) => `${q.qualityCompliance}%`}
                winner={(q) => q.qualityCompliance === Math.max(...quotes.map((x) => x.qualityCompliance))}
              />
              <Row
                label={t('compare.warranty')}
                render={(q) => t('compare.years', { n: q.warrantyYears })}
                winner={(q) => q.warrantyYears === Math.max(...quotes.map((x) => x.warrantyYears))}
              />
              <Row
                label={t('compare.paymentTerms')}
                render={(q) => q.paymentTerms}
                winner={() => false}
              />
              <Row
                label={t('compare.supplierRating')}
                render={(q) => (
                  <Rating value={q.supplier?.rating?.average} count={q.supplier?.rating?.count} />
                )}
                winner={() => false}
              />

              <tr>
                <th className="w-[220px] border-e border-line px-4 py-4 text-start text-[13px] font-medium text-slate-600">
                  {t('compare.action')}
                </th>
                {quotes.map((quote) => (
                  <td
                    key={quote._id}
                    className={clsx(
                      'border-e border-line px-4 py-4 text-center last:border-0',
                      quote._id === best._id && 'bg-success-soft/50',
                    )}
                  >
                    <Button
                      variant={quote._id === best._id ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full max-w-[190px]"
                      disabled={rfq?.status === 'awarded'}
                      onClick={() => setAwarding(quote)}
                    >
                      {t('compare.selectSupplier')}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(awarding)}
        onClose={() => setAwarding(null)}
        title={t('compare.awardConfirmTitle')}
        body={t('compare.awardConfirmBody', { supplier: awarding ? pick(awarding.supplier) : '' })}
        confirmLabel={t('compare.confirmAward')}
        cancelLabel={t('compare.cancel')}
        loading={award.loading}
        onConfirm={async () => {
          try {
            const res = await award.mutate(awarding._id);
            toast.success(res.message);
            setAwarding(null);
            navigate(`/buyer/orders/${res.data._id}`);
          } catch (err) {
            toast.error(err.message);
            refresh();
          }
        }}
      />
    </>
  );
};
