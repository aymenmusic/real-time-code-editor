import { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

const UserPresence = () => {
  const { users } = useEditorStore();
  
  // Debug: Log users whenever they change
  useEffect(() => {
    console.log('UserPresence - Current users:', users);
  }, [users]);

  return (
    <div className="user-presence">
      <h3>Connected Users</h3>
      <div className="user-list">
        {users.length === 0 ? (
          <div className="no-users">No users connected</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-item">
              <div
                className="user-color"
                style={{ backgroundColor: user.color }}
              />
              <span className="user-name">{user.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPresence;
