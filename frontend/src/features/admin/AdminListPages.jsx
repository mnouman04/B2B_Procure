import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useDebounced, useMutation } from '../../hooks/useApi.js';
import { adminApi, catalogApi } from '../../api/endpoints.js';
import { Card, StatCard } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Avatar, EmptyState, PageHeader, Rating } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD, Pagination, TableSkeleton } from '../../components/ui/Table.jsx';
import { formatDate, formatMoney } from '../../utils/format.js';

/** Shared search + paginated table shell for the admin list screens. */
const ListShell = ({ title, actions, searchPlaceholder, term, setTerm, filters, loading, empty, meta, setPage, children }) => {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={title} actions={actions} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          {filters}
          <Input
            className="ms-auto w-full sm:w-72"
            icon={Search}
            placeholder={searchPlaceholder ?? t('common.search')}
            value={term}
            onChange={(e) => { setTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="border-t border-line">
          {loading ? <TableSkeleton cols={5} /> : empty ? <EmptyState title={t('common.noData')} /> : children}
        </div>
        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>
    </>
  );
};

export const AdminCompaniesPage = () => {
  const { t, locale, pick } = useI18n();
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(term);

  const { data, meta, loading, refresh } = useApi(
    () => adminApi.companies({ page, limit: 12, ...(debounced ? { q: debounced } : {}) }),
    [page, debounced],
  );
  const setStatus = useMutation(({ id, status }) => adminApi.setCompanyStatus(id, status));

  return (
    <ListShell
      title={t('admin.companies')}
      term={term} setTerm={setTerm} setPage={setPage} meta={meta}
      loading={loading} empty={!data?.length}
    >
      <Table>
        <THead>
          <TH>{t('auth.companyName')}</TH>
          <TH>{t('auth.crNumber')}</TH>
          <TH>{t('auth.sector')}</TH>
          <TH>{t('rfq.created')}</TH>
          <TH align="end">{t('rfq.status')}</TH>
        </THead>
        <TBody>
          {(data ?? []).map((c) => (
            <TR key={c._id}>
              <TD>
                <span className="flex items-center gap-2.5">
                  <Avatar src={c.logo} name={pick(c)} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{pick(c)}</span>
                    <span className="block text-xs text-slate-400">{c.owner?.email}</span>
                  </span>
                </span>
              </TD>
              <TD>{c.crNumber}</TD>
              <TD>{c.sector}</TD>
              <TD>{formatDate(c.createdAt, locale)}</TD>
              <TD align="end">
                <span className="inline-flex items-center gap-2">
                  <StatusBadge status={c.status} size="xs" />
                  {c.status !== 'verified' && (
                    <Button
                      size="xs"
                      variant="soft"
                      loading={setStatus.loading}
                      onClick={async () => {
                        try {
                          await setStatus.mutate({ id: c._id, status: 'verified' });
                          toast.success(t('status.verified'));
                          refresh();
                        } catch (err) { toast.error(err.message); }
                      }}
                    >
                      {t('verification.approve')}
                    </Button>
                  )}
                </span>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  );
};

export const AdminSuppliersPage = () => {
  const { t, pick } = useI18n();
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(term);

  const { data, meta, loading } = useApi(
    () => adminApi.suppliers({ page, limit: 12, ...(debounced ? { q: debounced } : {}), ...(status ? { status } : {}) }),
    [page, debounced, status],
  );

  return (
    <ListShell
      title={t('admin.suppliers')}
      term={term} setTerm={setTerm} setPage={setPage} meta={meta}
      loading={loading} empty={!data?.length}
      filters={
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder={t('common.all')} className="w-44">
          {['verified', 'under_review', 'pending', 'rejected', 'suspended'].map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </Select>
      }
    >
      <Table>
        <THead>
          <TH>{t('orders.supplier')}</TH>
          <TH>{t('rfq.category')}</TH>
          <TH>{t('suppliers.city')}</TH>
          <TH align="center">{t('compare.supplierRating')}</TH>
          <TH align="end">{t('rfq.status')}</TH>
        </THead>
        <TBody>
          {(data ?? []).map((s) => (
            <TR key={s._id}>
              <TD>
                <span className="flex items-center gap-2.5">
                  <Avatar src={s.logo} name={pick(s)} size={32} />
                  <Link to={`/suppliers/${s.slug || s._id}`} className="truncate font-medium text-ink hover:text-info">
                    {pick(s)}
                  </Link>
                </span>
              </TD>
              <TD>{pick(s.primaryCategory)}</TD>
              <TD>{s.location?.city}</TD>
              <TD align="center"><Rating value={s.rating?.average} count={s.rating?.count} /></TD>
              <TD align="end"><StatusBadge status={s.status} size="xs" /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  );
};

export const AdminUsersPage = () => {
  const { t, locale } = useI18n();
  const [term, setTerm] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(term);

  const { data, meta, loading, refresh } = useApi(
    () => adminApi.users({ page, limit: 12, ...(debounced ? { q: debounced } : {}), ...(role ? { role } : {}) }),
    [page, debounced, role],
  );
  const toggle = useMutation(({ id, isActive }) => adminApi.setUserActive(id, isActive));

  return (
    <ListShell
      title={t('admin.users')}
      term={term} setTerm={setTerm} setPage={setPage} meta={meta}
      loading={loading} empty={!data?.length}
      filters={
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} placeholder={t('common.all')} className="w-44">
          {['buyer', 'supplier', 'admin'].map((r) => (
            <option key={r} value={r}>{t(`sidebar.${r}`)}</option>
          ))}
        </Select>
      }
    >
      <Table>
        <THead>
          <TH>{t('common.profile')}</TH>
          <TH>{t('auth.email')}</TH>
          <TH>{t('auth.companyName')}</TH>
          <TH>{t('rfq.created')}</TH>
          <TH align="end">{t('compare.action')}</TH>
        </THead>
        <TBody>
          {(data ?? []).map((u) => (
            <TR key={u._id}>
              <TD>
                <span className="flex items-center gap-2.5">
                  <Avatar name={`${u.firstName} ${u.lastName}`} size={32} rounded="full" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{u.firstName} {u.lastName}</span>
                    <span className="block text-xs text-slate-400">{u.jobTitle}</span>
                  </span>
                </span>
              </TD>
              <TD>{u.email}</TD>
              <TD>{u.company?.name || u.supplier?.name || '—'}</TD>
              <TD>{formatDate(u.createdAt, locale)}</TD>
              <TD align="end">
                <span className="inline-flex items-center gap-2">
                  <Badge tone={u.isActive ? 'success' : 'neutral'} size="xs">
                    {u.isActive ? t('admin.activate') : t('admin.deactivate')}
                  </Badge>
                  <Button
                    size="xs"
                    variant="soft"
                    loading={toggle.loading}
                    onClick={async () => {
                      try {
                        await toggle.mutate({ id: u._id, isActive: !u.isActive });
                        refresh();
                      } catch (err) { toast.error(err.message); }
                    }}
                  >
                    {u.isActive ? t('admin.deactivate') : t('admin.activate')}
                  </Button>
                </span>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  );
};

export const AdminRfqsPage = () => {
  const { t, locale, pick } = useI18n();
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(term);

  const { data, meta, loading } = useApi(
    () => adminApi.rfqs({ page, limit: 12, ...(debounced ? { q: debounced } : {}) }),
    [page, debounced],
  );

  return (
    <ListShell
      title={t('admin.rfqs')}
      term={term} setTerm={setTerm} setPage={setPage} meta={meta}
      loading={loading} empty={!data?.length}
    >
      <Table>
        <THead>
          <TH>{t('rfq.rfqNumber')}</TH>
          <TH>{t('rfq.title')}</TH>
          <TH>{t('auth.companyName')}</TH>
          <TH align="center">{t('rfq.quotesCount')}</TH>
          <TH>{t('rfq.created')}</TH>
          <TH align="end">{t('rfq.status')}</TH>
        </THead>
        <TBody>
          {(data ?? []).map((rfq) => (
            <TR key={rfq._id}>
              <TD className="font-bold text-navy-800">{rfq.rfqNumber}</TD>
              <TD className="max-w-[240px]"><span className="block truncate font-medium text-ink">{rfq.title}</span></TD>
              <TD>{pick(rfq.company)}</TD>
              <TD align="center">{rfq.quotesCount}</TD>
              <TD>{formatDate(rfq.createdAt, locale)}</TD>
              <TD align="end"><StatusBadge status={rfq.status} size="xs" /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </ListShell>
  );
};

export const AdminCommissionsPage = () => {
  const { t, locale, pick } = useI18n();
  const [page, setPage] = useState(1);
  const { data, meta, loading } = useApi(() => adminApi.commissions({ page, limit: 15 }), [page]);
  const { data: totals } = useApi(() => adminApi.commissionTotals(), []);

  return (
    <>
      <PageHeader title={t('admin.commissionReport')} />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('admin.gmv')}
          value={<><span className="me-1 text-base font-bold">{t('common.currency')}</span>{formatMoney(totals?.gmv ?? 0, { compact: true })}</>}
        />
        <StatCard
          label={t('admin.commission')}
          tone="success"
          value={<><span className="me-1 text-base font-bold">{t('common.currency')}</span>{formatMoney(totals?.commission ?? 0, { compact: true })}</>}
        />
        <StatCard label={t('admin.orders')} value={totals?.orders ?? 0} />
      </div>

      <Card>
        {loading ? (
          <TableSkeleton cols={6} />
        ) : data?.length ? (
          <Table>
            <THead>
              <TH>{t('orders.poNumber')}</TH>
              <TH>{t('auth.companyName')}</TH>
              <TH>{t('orders.supplier')}</TH>
              <TH align="end">{t('orders.total')}</TH>
              <TH align="end">{t('admin.commission')}</TH>
              <TH align="end">{t('rfq.created')}</TH>
            </THead>
            <TBody>
              {data.map((po) => (
                <TR key={po._id}>
                  <TD className="font-bold text-navy-800">{po.poNumber}</TD>
                  <TD>{pick(po.company)}</TD>
                  <TD>{pick(po.supplier)}</TD>
                  <TD align="end" className="font-semibold text-ink">{formatMoney(po.total)}</TD>
                  <TD align="end" className="font-bold text-success">{formatMoney(po.commission)}</TD>
                  <TD align="end">{formatDate(po.createdAt, locale)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title={t('common.noData')} />
        )}
        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>
    </>
  );
};

export const AdminCategoriesPage = () => {
  const { t, pick } = useI18n();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: categories, loading, refresh } = useApi(() => catalogApi.categories(), []);
  const save = useMutation((payload) =>
    payload._id ? adminApi.updateCategory(payload._id, payload) : adminApi.createCategory(payload),
  );
  const remove = useMutation((id) => adminApi.removeCategory(id));

  const submit = async () => {
    try {
      const res = await save.mutate({
        _id: editing._id,
        name: editing.name,
        nameAr: editing.nameAr,
        icon: editing.icon || 'package',
        parent: editing.parent || null,
        order: Number(editing.order) || 0,
      });
      toast.success(res.message);
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title={t('sidebar.categories')}
        actions={
          <Button icon={Plus} onClick={() => setEditing({ name: '', nameAr: '', icon: 'package', parent: '', order: 0 })}>
            {t('admin.addCategory')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-40" />)
          : (categories ?? []).map((c) => (
              <Card key={c._id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-ink">{pick(c)}</p>
                    <p className="text-xs text-slate-500">{c.children?.length ?? 0} sub-categories</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="xs" variant="ghost" onClick={() => setEditing({ ...c, parent: c.parent ?? '' })}>
                      {t('common.edit')}
                    </Button>
                    <Button size="xs" variant="ghost" icon={Trash2} onClick={() => setDeleting(c)} aria-label={t('common.delete')} />
                  </div>
                </div>

                {c.children?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {c.children.map((child) => (
                      <li key={child._id}>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...child, parent: child.parent ?? '' })}
                          className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-navy-300"
                        >
                          {pick(child)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? t('common.edit') : t('admin.addCategory')}
        footer={
          <>
            <Button variant="soft" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button onClick={submit} loading={save.loading}>{t('common.save')}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input label="Name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Name (AR)" dir="rtl" value={editing.nameAr ?? ''} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} />
            <Select label="Parent" value={editing.parent ?? ''} onChange={(e) => setEditing({ ...editing, parent: e.target.value })} placeholder="— Root category —">
              {(categories ?? []).filter((c) => c._id !== editing._id).map((c) => (
                <option key={c._id} value={c._id}>{pick(c)}</option>
              ))}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Icon" value={editing.icon ?? ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} hint="construction · zap · settings · box · monitor · truck · building" />
              <Input label="Order" type="number" value={editing.order ?? 0} onChange={(e) => setEditing({ ...editing, order: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t('common.delete')}
        body={deleting ? pick(deleting) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={remove.loading}
        onConfirm={async () => {
          try {
            await remove.mutate(deleting._id);
            toast.success(t('common.delete'));
            setDeleting(null);
            refresh();
          } catch (err) {
            toast.error(err.message);
          }
        }}
      />
    </>
  );
};
