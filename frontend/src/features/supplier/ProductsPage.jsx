import { useState } from 'react';
import { Plus, Package, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { catalogApi, supplierApi } from '../../api/endpoints.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { EmptyState, PageHeader } from '../../components/ui/Misc.jsx';
import { Table, THead, TH, TBody, TR, TD, Pagination, TableSkeleton } from '../../components/ui/Table.jsx';
import { formatMoney } from '../../utils/format.js';

const blank = () => ({
  name: '', nameAr: '', category: '', description: '', unit: 'pcs',
  priceFrom: '', priceTo: '', minOrderQuantity: 1, leadTimeDays: 7,
});

/** Products & Services catalogue shown on the supplier's public profile. */
export const ProductsPage = () => {
  const { t, pick } = useI18n();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: products, meta, loading, refresh } = useApi(
    () => supplierApi.myProducts({ page, limit: 12 }),
    [page],
  );
  const { data: categories } = useApi(() => catalogApi.categories(), []);
  const { data: reference } = useApi(() => catalogApi.reference(), []);

  const save = useMutation((payload) =>
    payload._id ? supplierApi.updateProduct(payload._id, payload) : supplierApi.addProduct(payload),
  );
  const remove = useMutation((id) => supplierApi.removeProduct(id));

  const flatCategories = (categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);

  const submit = async () => {
    const payload = {
      ...editing,
      priceFrom: editing.priceFrom === '' ? null : Number(editing.priceFrom),
      priceTo: editing.priceTo === '' ? null : Number(editing.priceTo),
      minOrderQuantity: Number(editing.minOrderQuantity) || 1,
      leadTimeDays: Number(editing.leadTimeDays) || 0,
      specifications: editing.specifications ?? [],
      images: editing.images ?? [],
    };
    try {
      const res = await save.mutate(payload);
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
        title={t('sidebar.productsServices')}
        actions={
          <Button icon={Plus} onClick={() => setEditing(blank())}>
            {t('rfq.addItem')}
          </Button>
        }
      />

      <Card>
        {loading ? (
          <TableSkeleton cols={5} />
        ) : products?.length ? (
          <Table>
            <THead>
              <TH>{t('rfq.itemName')}</TH>
              <TH>{t('rfq.category')}</TH>
              <TH align="center">{t('rfq.unit')}</TH>
              <TH align="end">{t('quotation.unitPrice')}</TH>
              <TH align="center">{t('compare.deliveryTime')}</TH>
              <TH align="end">{t('compare.action')}</TH>
            </THead>
            <TBody>
              {products.map((p) => (
                <TR key={p._id}>
                  <TD>
                    <span className="font-medium text-ink">{pick(p)}</span>
                    {p.description && (
                      <span className="block max-w-[320px] truncate text-xs text-slate-400">{p.description}</span>
                    )}
                  </TD>
                  <TD>{pick(p.category)}</TD>
                  <TD align="center">{p.unit}</TD>
                  <TD align="end">
                    {p.priceFrom != null
                      ? `${formatMoney(p.priceFrom, { decimals: 0 })}${p.priceTo ? ` – ${formatMoney(p.priceTo, { decimals: 0 })}` : ''}`
                      : '—'}
                  </TD>
                  <TD align="center">{p.leadTimeDays} {t('analytics.days')}</TD>
                  <TD align="end">
                    <span className="inline-flex gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Pencil}
                        onClick={() => setEditing({ ...p, category: p.category?._id ?? p.category })}
                        aria-label={t('common.edit')}
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => setDeleting(p)}
                        aria-label={t('common.delete')}
                      />
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={Package}
            title={t('suppliers.noProducts')}
            action={
              <Button size="sm" icon={Plus} onClick={() => setEditing(blank())}>
                {t('rfq.addItem')}
              </Button>
            }
          />
        )}

        <div className="border-t border-line">
          <Pagination meta={meta} onChange={setPage} />
        </div>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? t('common.edit') : t('rfq.addItem')}
        size="lg"
        footer={
          <>
            <Button variant="soft" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button onClick={submit} loading={save.loading}>{t('common.save')}</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('rfq.itemName')}
              required
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              label={`${t('rfq.itemName')} (AR)`}
              dir="rtl"
              value={editing.nameAr}
              onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
            />
            <Select
              label={t('rfq.category')}
              required
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              placeholder={t('rfq.category')}
            >
              {flatCategories.map((c) => (
                <option key={c._id} value={c._id}>{pick(c)}</option>
              ))}
            </Select>
            <Select
              label={t('rfq.unit')}
              value={editing.unit}
              onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
            >
              {(reference?.units ?? ['pcs']).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
            <Input
              label={`${t('quotation.unitPrice')} (from)`}
              type="number"
              min="0"
              value={editing.priceFrom}
              onChange={(e) => setEditing({ ...editing, priceFrom: e.target.value })}
            />
            <Input
              label={`${t('quotation.unitPrice')} (to)`}
              type="number"
              min="0"
              value={editing.priceTo}
              onChange={(e) => setEditing({ ...editing, priceTo: e.target.value })}
            />
            <Input
              label="MOQ"
              type="number"
              min="1"
              value={editing.minOrderQuantity}
              onChange={(e) => setEditing({ ...editing, minOrderQuantity: e.target.value })}
            />
            <Input
              label={t('quotation.deliveryDays')}
              type="number"
              min="0"
              value={editing.leadTimeDays}
              onChange={(e) => setEditing({ ...editing, leadTimeDays: e.target.value })}
            />
            <Textarea
              className="sm:col-span-2"
              label={t('auth.about')}
              rows={3}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
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
