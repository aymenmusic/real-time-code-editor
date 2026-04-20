import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';

const UserPresence = () => {
  const { users } = useEditorStore();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="user-presence">
      <h3>Connected Users</h3>
      <div className="user-list">
        {users.length === 0 ? (
          <div className="no-users">No users connected</div>
        ) : (
          users.map((user) => {
            const isYou = currentUser?.id.toString() === user.id;
            // Up to 2-character initials from the username
            const initials = user.name.slice(0, 2).toUpperCase();

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
                {isYou && <span className="user-you-badge">You</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserPresence;
