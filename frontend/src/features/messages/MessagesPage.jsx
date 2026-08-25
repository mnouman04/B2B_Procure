import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { messageApi } from '../../api/endpoints.js';
import { selectUser } from '../../store/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar, EmptyState, PageHeader, Spinner } from '../../components/ui/Misc.jsx';
import { timeAgo, truncate } from '../../utils/format.js';

/**
 * Messages — a two-pane inbox. Conversations are scoped to an RFQ or PO where
 * one exists, so the thread always carries its commercial context.
 */
export const MessagesPage = () => {
  const { t, pick } = useI18n();
  const user = useSelector(selectUser);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const scroller = useRef(null);

  const { data: conversations, loading: loadingList, refresh: refreshList } =
    useApi(() => messageApi.conversations({ limit: 30 }), []);

  const { data: messages, loading: loadingThread, refresh: refreshThread } = useApi(
    () => messageApi.messages(activeId, { limit: 100 }),
    [activeId],
    { immediate: false },
  );

  const send = useMutation((body) => messageApi.send(activeId, { body, attachments: [] }));

  useEffect(() => {
    if (!activeId && conversations?.length) setActiveId(conversations[0]._id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (activeId) refreshThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  const active = conversations?.find((c) => c._id === activeId);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await send.mutate(draft.trim());
      setDraft('');
      refreshThread();
      refreshList();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title={t('messages.title')} />

      <Card className="grid h-[calc(100vh-220px)] min-h-[480px] grid-cols-1 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]">
        {/* Conversation list */}
        <div className="hidden flex-col border-e border-line md:flex">
          <p className="border-b border-line px-4 py-3.5 text-sm font-bold text-ink">
            {t('messages.conversations')}
          </p>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="grid place-items-center py-10"><Spinner /></div>
            ) : conversations?.length ? (
              conversations.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveId(c._id)}
                  className={clsx(
                    'flex w-full gap-3 border-b border-line/70 px-4 py-3.5 text-start transition',
                    c._id === activeId ? 'bg-navy-50/70' : 'hover:bg-slate-50',
                  )}
                >
                  <Avatar
                    name={pick(c.supplier) || pick(c.company) || c.counterpart?.firstName || '?'}
                    size={38}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-bold text-ink">
                        {pick(c.supplier) || pick(c.company) ||
                          `${c.counterpart?.firstName ?? ''} ${c.counterpart?.lastName ?? ''}`}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="grid h-4.5 min-w-[18px] place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy-900">
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                    {c.rfq && <span className="block truncate text-[11px] text-info">{c.rfq.rfqNumber}</span>}
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {truncate(c.lastMessage?.body ?? '', 44)}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <EmptyState icon={MessageSquare} title={t('messages.noConversations')} className="py-10" />
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <Avatar name={pick(active.supplier) || pick(active.company) || '?'} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {pick(active.supplier) || pick(active.company) ||
                      `${active.counterpart?.firstName ?? ''} ${active.counterpart?.lastName ?? ''}`}
                  </p>
                  {active.rfq && (
                    <p className="truncate text-xs text-slate-500">
                      {active.rfq.rfqNumber} — {active.rfq.title}
                    </p>
                  )}
                </div>
              </div>

              <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
                {loadingThread ? (
                  <div className="grid place-items-center py-10"><Spinner /></div>
                ) : (
                  (messages ?? []).map((m) => {
                    const mine = String(m.sender?._id ?? m.sender) === String(user._id);
                    return (
                      <div key={m._id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={clsx(
                            'max-w-[75%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-card',
                            mine
                              ? 'rounded-ee-sm bg-navy-900 text-white'
                              : 'rounded-es-sm border border-line bg-white text-slate-700',
                          )}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[11px] font-bold text-navy-700">
                              {m.sender?.firstName} {m.sender?.lastName}
                            </p>
                          )}
                          <p>{m.body}</p>
                          <p className={clsx('mt-1 text-[10px]', mine ? 'text-white/50' : 'text-slate-400')}>
                            {timeAgo(m.createdAt, t)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('messages.typeMessage')}
                  className="field flex-1"
                />
                <Button type="submit" icon={Send} loading={send.loading} disabled={!draft.trim()}>
                  <span className="hidden sm:inline">{t('messages.send')}</span>
                </Button>
              </form>
            </>
          ) : (
            <EmptyState icon={MessageSquare} title={t('messages.selectConversation')} className="my-auto" />
          )}
        </div>
      </Card>
    </>
  );
};
