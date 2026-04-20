import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { websocketService } from '../../services/websocketService';

const UserPresence = () => {
  const { users } = useEditorStore();
  const { user: currentUser } = useAuthStore();
  /** userId of the last person we guided (drives the brief "✓ Sent" flash) */
  const [guidedUserId, setGuidedUserId] = useState<string | null>(null);

  const handleGuide = (targetUserId: string) => {
    // Send the sender's current cursor position in the Monaco editor
    const ed = useEditorStore.getState().editor;
    const pos = ed?.getPosition();
    websocketService.sendGuideCursor(
      targetUserId,
      pos?.lineNumber ?? 1,
      pos?.column ?? 1,
    );

    // Brief confirmation flash on the button
    setGuidedUserId(targetUserId);
    setTimeout(() => setGuidedUserId(null), 1500);
  };

  return (
    <div className="user-presence">
      <h3>Connected Users</h3>
      <div className="user-list">
        {users.length === 0 ? (
          <div className="no-users">No users connected</div>
        ) : (
          users.map((user) => {
            const isYou   = currentUser?.id.toString() === user.id;
            const initials = user.name.slice(0, 2).toUpperCase();
            const justGuided = guidedUserId === user.id;

            return (
              <div key={user.id} className="user-item">
                <div
                  className="user-avatar"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {initials}
                </div>
                <span className="user-name">{user.name}</span>

                {isYou ? (
                  <span className="user-you-badge">You</span>
                ) : (
                  /* ── Guide-cursor button ── */
                  <button
                    className={`guide-btn${justGuided ? ' guide-btn--sent' : ''}`}
                    style={justGuided ? { color: user.color, borderColor: user.color } : undefined}
                    onClick={() => handleGuide(user.id)}
                    title={`Guide ${user.name} to your cursor position`}
                    aria-label={`Guide ${user.name} to your cursor`}
                  >
                    {justGuided ? (
                      /* Checkmark: confirmed */
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                           aria-hidden="true">
                        <polyline points="3 8 6.5 11.5 13 5" />
                      </svg>
                    ) : (
                      /* Crosshair: guide */
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                           strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                           aria-hidden="true">
                        <circle cx="8" cy="8" r="3" />
                        <line x1="8" y1="1" x2="8" y2="4" />
                        <line x1="8" y1="12" x2="8" y2="15" />
                        <line x1="1" y1="8" x2="4" y2="8" />
                        <line x1="12" y1="8" x2="15" y2="8" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserPresence;
