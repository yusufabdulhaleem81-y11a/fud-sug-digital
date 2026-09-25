import { useEffect, useState } from 'react';
import { listNotifications, markNotificationRead, type Notification } from '../../services/notificationService';
import { Badge, Button, EmptyState, PageHeader, Panel, PanelHead, SkeletonRows, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

export default function NotificationsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { setItems(await listNotifications()); }
  useEffect(() => { load(); }, []);

  async function read(n: Notification) {
    if (n.is_read) return;
    await markNotificationRead(n.id);
    await load();
  }

  async function readAll() {
    if (!items) return;
    setBusy(true);
    try {
      await Promise.all(items.filter((n) => !n.is_read).map((n) => markNotificationRead(n.id)));
      toast('All notifications marked as read');
      await load();
    } finally { setBusy(false); }
  }

  const unread = items?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div>
      <PageHeader title="Notifications"
        subtitle={unread > 0 ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}.` : 'You are all caught up.'}
        right={unread > 0 ? <Button size="sm" variant="ghost" disabled={busy} onClick={readAll}>Mark all as read</Button> : undefined} />
      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No notifications yet" description="Case assignments, decisions and directives will appear here." />
      ) : (
        <Panel>
          <PanelHead title="Recent" />
          {items.map((n) => (
            <div key={n.id} className="row" style={{ cursor: n.is_read ? 'default' : 'pointer', background: n.is_read ? undefined : '#F4F7F1' }}
              onClick={() => read(n)}>
              <div className="row-main">
                <div className="row-top">
                  {!n.is_read && <Badge tone="green">New</Badge>}
                  {n.type && <span className="cattag">{n.type.replace(/_/g, ' ')}</span>}
                </div>
                <h4>{n.title}</h4>
                {n.body && <p className="mut small" style={{ marginTop: 2 }}>{n.body}</p>}
                <div className="meta"><span>{timeAgo(n.created_at)}</span></div>
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}