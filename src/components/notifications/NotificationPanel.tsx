import { useNavigate } from 'react-router-dom'
import {
  AppNotification, notifConfig,
  markAsRead, markAllAsRead, deleteNotification,
} from '@/lib/notification-helpers'
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  notifications: AppNotification[]
  projectId:     string
  onClose:       () => void
}

export default function NotificationPanel({ notifications, projectId, onClose }: Props) {
  const navigate  = useNavigate()
  const unread    = notifications.filter(n => !n.read).length

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) await markAsRead(notif.id)
    onClose()
    navigate(notif.link)
  }

  const timeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-civil-card border-l border-civil-border flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-civil-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-civil-accent" />
            <h2 className="font-semibold text-civil-text text-sm">Notifications</h2>
            {unread > 0 && (
              <span className="text-[10px] bg-civil-accent text-white px-1.5 py-0.5 rounded-full font-bold">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead(projectId)}
                className="flex items-center gap-1 text-[10px] text-civil-muted hover:text-civil-accent transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-civil-muted hover:text-civil-text">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bell className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-medium text-sm">No notifications</p>
              <p className="text-civil-muted text-xs mt-1">
                Notifications appear here for delays, approvals, and issues.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-civil-border">
              {notifications.map(notif => {
                const cfg = notifConfig[notif.type]
                return (
                  <div
                    key={notif.id}
                    className={clsx(
                      'flex gap-3 px-4 py-3 cursor-pointer transition-colors group',
                      notif.read
                        ? 'hover:bg-civil-surface/40'
                        : 'bg-civil-accent/5 hover:bg-civil-accent/10'
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Icon */}
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base',
                      cfg.bg
                    )}>
                      {cfg.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={clsx(
                          'text-xs font-semibold',
                          notif.read ? 'text-civil-muted' : 'text-civil-text'
                        )}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-civil-accent flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-civil-muted mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-civil-muted/60 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(notif.id) }}
                      className="opacity-0 group-hover:opacity-100 text-civil-muted hover:text-red-400 transition-all flex-shrink-0 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
