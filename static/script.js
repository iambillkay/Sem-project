document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username-input');
  const commentInput  = document.getElementById('comment-input');
  const shareButton   = document.getElementById('share');
  const cancelButton  = document.getElementById('cancel');
  const commentsScreen = document.getElementById('comments-screen');
  const commentCountSpan = document.getElementById('comment-count');

  // small helper to create buttons
  function createButton(className, html, title='') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.title = title;
    b.innerHTML = html;
    return b;
  }

  // set default actions into an actions container
  function setDefaultActions(actionsContainer) {
    actionsContainer.innerHTML = '';
    const editBtn = createButton('edit-btn','<i class="fa-solid fa-pen-to-square"></i>','Edit');
    const delBtn  = createButton('delete-btn','<i class="fa-solid fa-trash"></i>','Delete');
    actionsContainer.appendChild(editBtn);
    actionsContainer.appendChild(delBtn);
  }

  // render comments into the screen
  function renderComments(comments) {
    commentsScreen.innerHTML = '';
    if (!Array.isArray(comments) || comments.length === 0) {
      commentCountSpan.textContent = 0;
      commentsScreen.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
      return;
    }
    commentCountSpan.textContent = comments.length;

    comments.forEach(c => {
      const id = c.id;
      const card = document.createElement('div');
      card.className = 'comment-item';
      card.dataset.id = id;

      // ROW 1: header
      const header = document.createElement('div');
      header.className = 'comment-header';

      const leftSide = document.createElement('div');
      leftSide.className = 'header-left';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      if (c.username && c.username.trim()) avatar.textContent = c.username.charAt(0).toUpperCase();
      else avatar.innerHTML = '<i class="fa-solid fa-user"></i>';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'comment-item-username';
      nameSpan.textContent = c.username || 'Anonymous';

      leftSide.appendChild(avatar);
      leftSide.appendChild(nameSpan);

      const ts = document.createElement('span');
      ts.className = 'timestamp';
      ts.textContent = c.timestamp || '';

      header.appendChild(leftSide);
      header.appendChild(ts);

      // ROW 2: body (grid with text left, actions right)
      const bodyRow = document.createElement('div');
      bodyRow.className = 'comment-body';

      const textDiv = document.createElement('div');
      textDiv.className = 'comment-text';
      textDiv.textContent = c.comment || '';

      const actions = document.createElement('div');
      actions.className = 'comment-actions';
      setDefaultActions(actions);

      bodyRow.appendChild(textDiv);
      bodyRow.appendChild(actions);

      // assemble
      card.appendChild(header);
      card.appendChild(bodyRow);
      commentsScreen.appendChild(card);
    });
  }

  // fetch comments
  async function fetchComments(){
    try {
      const res = await fetch('/get_comments');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      renderComments(data);
    } catch (err) {
      console.error('fetchComments error', err);
      commentsScreen.innerHTML = '<p class="no-comments">Could not load comments.</p>';
      commentCountSpan.textContent = 0;
    }
  }
  // Theme switcher
  const themeBtn = document.getElementById('theme-btn');
  const themeMenu = document.getElementById('theme-menu');

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', () => {
      themeMenu.classList.toggle('hidden');
    });

    themeMenu.addEventListener('click', (e) => {
      const choice = e.target.dataset.theme;
      if (!choice) return;
      document.documentElement.className = ''; // reset
      document.documentElement.classList.add('theme-' + choice);
      localStorage.setItem('theme', choice);
      themeMenu.classList.add('hidden');
    });

    // Load saved theme
    const saved = localStorage.getItem('theme') || 'green';
    document.documentElement.classList.add('theme-' + saved);
  }

  // add comment
  shareButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const comment  = commentInput.value.trim();
    if (!username || !comment) {
      alert('Please enter both username and comment.');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('comment', comment);
      const res = await fetch('/add_comment',{ method:'POST', body: fd });
      if (!res.ok) throw new Error('Add failed');
      usernameInput.value = '';
      commentInput.value = '';
      await fetchComments();
    } catch (err) {
      console.error('Add comment error', err);
      alert('Failed to add comment.');
    }
  });

  cancelButton.addEventListener('click', ()=> {
    usernameInput.value = '';
    commentInput.value = '';
  });

  // Delegated actions handler
  commentsScreen.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const card = btn.closest('.comment-item');
    if (!card) return;
    const id = card.dataset.id;
    const actions = card.querySelector('.comment-actions');

    // EDIT -> replace text with textarea; swap actions to Save/Cancel
    if (btn.classList.contains('edit-btn')) {
      if (card.dataset.editing === 'true') return;
      const textDiv = card.querySelector('.comment-text');
      card.dataset.originalText = textDiv.textContent;
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-textarea';
      textarea.value = textDiv.textContent;
      textDiv.replaceWith(textarea);

      actions.innerHTML = '';
      const saveBtn = createButton('save-btn','<i class="fa-solid fa-check"></i>','Save');
      const cancelEditBtn = createButton('cancel-edit-btn','<i class="fa-solid fa-xmark"></i>','Cancel');
      actions.appendChild(saveBtn);
      actions.appendChild(cancelEditBtn);

      card.dataset.editing = 'true';
      textarea.focus();
      return;
    }

    // SAVE
    if (btn.classList.contains('save-btn')) {
      const textarea = card.querySelector('.edit-textarea');
      if (!textarea) return;
      const newText = textarea.value.trim();
      if (newText === '') { alert('Comment cannot be empty.'); return; }
      try {
        const fd = new FormData();
        fd.append('comment_id', id);
        fd.append('new_comment', newText);
        const res = await fetch('/update_comment', { method:'POST', body: fd });
        if (!res.ok) throw new Error('Update failed');
        await fetchComments(); // reload so timestamp updates too
      } catch (err) {
        console.error('Save error', err);
        alert('Failed to save comment.');
      }
      return;
    }

    // CANCEL edit
    if (btn.classList.contains('cancel-edit-btn')) {
      const orig = card.dataset.originalText || '';
      const textarea = card.querySelector('.edit-textarea');
      if (textarea) {
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.textContent = orig;
        textarea.replaceWith(textDiv);
      }
      actions.innerHTML = '';
      setDefaultActions(actions);
      delete card.dataset.editing;
      delete card.dataset.originalText;
      return;
    }

    // DELETE -> inline confirm (Yes / No)
    if (btn.classList.contains('delete-btn')) {
      if (card.dataset.confirming === 'true') return;
      actions.innerHTML = '';
      const msg = document.createElement('div');
      msg.className = 'confirm-text';
      msg.textContent = 'Delete?';
      const yes = createButton('confirm-delete-btn','<i class="fa-solid fa-check"></i>','Yes');
      const no  = createButton('cancel-delete-btn','<i class="fa-solid fa-xmark"></i>','No');
      actions.appendChild(msg);
      actions.appendChild(yes);
      actions.appendChild(no);
      card.dataset.confirming = 'true';
      return;
    }

    // CONFIRM DELETE
    if (btn.classList.contains('confirm-delete-btn')) {
      try {
        const fd = new FormData();
        fd.append('comment_id', id);
        const res = await fetch('/delete_comment', { method:'POST', body: fd });
        if (!res.ok) throw new Error('Delete failed');
        await fetchComments();
      } catch (err) {
        console.error('Delete error', err);
        alert('Failed to delete comment.');
      }
      return;
    }

    // CANCEL delete
    if (btn.classList.contains('cancel-delete-btn')) {
      actions.innerHTML = '';
      setDefaultActions(actions);
      delete card.dataset.confirming;
      return;
    }
  });

  // initial load
  fetchComments();
});
