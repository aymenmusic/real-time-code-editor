import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const ShareButton = () => {
  const [copied, setCopied] = useState(false);
  const { isGuest, user } = useAuthStore();

  const handleCopy = async () => {
    if (isGuest) return; // disabled for guests

    // Append the inviter's username so the login/register page can show
    // a personalised "invited by X" banner to the recipient.
    const base = window.location.href.split('?')[0]; // strip any existing params
    const shareUrl = user?.username
      ? `${base}?invitedBy=${encodeURIComponent(user.username)}`
      : base;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className={`share-button-wrapper${isGuest ? ' share-button-wrapper--guest' : ''}`}>
      <button
        className={`share-button${copied ? ' share-button--copied' : ''}${isGuest ? ' share-button--guest' : ''}`}
        onClick={handleCopy}
        disabled={isGuest}
        title={isGuest ? '' : 'Copy room link to clipboard'}
        aria-label={isGuest ? 'Sign in to share this session' : 'Copy room link to clipboard'}
        aria-disabled={isGuest}
      >
        {copied ? (
          <>
            {/* Checkmark icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            {/* Link icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Share</span>
          </>
        )}
      </button>

      {/* Tooltip — only shown when hovered in guest mode */}
      {isGuest && (
        <div className="share-button-tooltip" role="tooltip">
          <div className="share-button-tooltip__caret" />
          <div className="share-button-tooltip__body">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Sign in to share &amp; collaborate</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
