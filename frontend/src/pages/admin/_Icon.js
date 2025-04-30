import React from 'react';

export function EyeIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5c-7 0-9 7.5-9 7.5s2 7.5 9 7.5 9-7.5 9-7.5-2-7.5-9-7.5zm0 13a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.06 10.06 0 0112 19.5c-7 0-9-7.5-9-7.5a17.92 17.92 0 013.06-4.44M6.1 6.1A9.97 9.97 0 0112 4.5c7 0 9 7.5 9 7.5a17.9 17.9 0 01-3.06 4.44M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function EditIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h2v2h2v-2h2v-2h-2v-2h-2v2h-2v2z" />
    </svg>
  );
}

export function TrashIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
    </svg>
  );
}
