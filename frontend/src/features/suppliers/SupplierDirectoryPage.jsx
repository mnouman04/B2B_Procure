import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, X } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { catalogApi, supplierApi } from '../../api/endpoints.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input, Select, Checkbox } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, PageHeader, Skeleton } from '../../components/ui/Misc.jsx';
import { Pagination } from '../../components/ui/Table.jsx';
import { SupplierGridCard } from '../../components/common/SupplierCard.jsx';

/** Browse Suppliers — the public directory behind the hero search bar. */
export const SupplierDirectoryPage = ({ embedded = false }) => {
  const { t, pick } = useI18n();
  const [params, setParams] = useSearchParams();

  const [term, setTerm] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [city, setCity] = useState(params.get('city') ?? '');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);
  const debouncedTerm = useDebounced(term);

  const { data: categories } = useApi(() => catalogApi.categories(), []);
  const { data: reference } = useApi(() => catalogApi.reference(), []);

  const { data: suppliers, meta, loading } = useApi(
    () =>
      supplierApi.list({
        page,
        limit: 12,
        ...(debouncedTerm ? { q: debouncedTerm } : {}),
        ...(category ? { category } : {}),
        ...(city ? { city } : {}),
        ...(minRating ? { minRating } : {}),
      }),
    [page, debouncedTerm, category, city, minRating],
  );

  const clear = () => {
    setTerm(''); setCategory(''); setCity(''); setMinRating(''); setPage(1);
    setParams({});
  };

  const hasFilters = term || category || city || minRating;

  const content = (
    <>
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Input
            icon={Search}
            placeholder={t('suppliers.search')}
            value={term}
            onChange={(e) => { setTerm(e.target.value); setPage(1); }}
          />
          <Select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            placeholder={t('suppliers.category')}
          >
            {(categories ?? []).map((c) => (
              <option key={c._id} value={c._id}>{pick(c)}</option>
            ))}
          </Select>
          <Select
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            placeholder={t('suppliers.city')}
          >
            {(reference?.cities ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
            placeholder={t('suppliers.minRating')}
          >
            {[4.5, 4, 3.5, 3].map((r) => (
              <option key={r} value={r}>{r}+</option>
            ))}
          </Select>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <p className="text-xs text-slate-500">{t('common.results', { n: meta?.total ?? 0 })}</p>
            <Button size="xs" variant="ghost" icon={X} onClick={clear}>
              {t('suppliers.clear')}
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[268px]" />)
          : (suppliers ?? []).map((s) => <SupplierGridCard key={s._id} supplier={s} />)}
      </div>

      {!loading && !suppliers?.length && (
        <Card className="mt-4">
          <EmptyState icon={Users} title={t('suppliers.noResults')} />
        </Card>
      )}

      {meta?.pages > 1 && (
        <Card className="mt-4">
          <Pagination meta={meta} onChange={setPage} />
        </Card>
      )}
    </>
  );

  if (embedded) {
    return (
      <>
        <PageHeader title={t('suppliers.directory')} />
        {content}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-9">
      <PageHeader title={t('suppliers.directory')} subtitle={t('home.heroSubtitle').replace('\n', ' ')} />
      {content}
    </div>
  );
};
