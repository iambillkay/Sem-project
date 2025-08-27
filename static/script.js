document.addEventListener('DOMContentLoaded', function () {
    const usernameInput = document.getElementById('username-input');
    const commentInput = document.getElementById('comment-input');
    const shareButton = document.getElementById('share');
    const cancelButton = document.getElementById('cancel');
    const commentsScreen = document.getElementById('comments-screen');
    const commentCountSpan = document.getElementById('comment-count');
    async function fetchComments() {
        try {
            const response = await fetch('/get_comments');
            const comments = await response.json();
            commentsScreen.innerHTML = '';
            commentCountSpan.textContent = comments.length;

            if (comments.length === 0) {
                commentsScreen.innerHTML = '<p style="text-align: center; padding-top: 20px; color: gray;">No comments yet. Be the first to comment!</p>';
            } else {
                comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.classList.add('comment-item');
                    commentDiv.setAttribute('data-id', comment.id);

                    commentDiv.innerHTML = `
                        <p><span class="comment-item-username">${comment.username}</span> <span class="timestamp">${comment.timestamp}</span></p>
                        <p class="comment-text">${comment.comment}</p>
                        <div class="comment-actions">
                            <button class="edit-btn">Edit</button>
                            <button class="delete-btn">Delete</button>
                        </div>
                        <button onclick="deledit(this)" class="deledit"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    `;
                    commentsScreen.appendChild(commentDiv);
                });
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }

    // Function to add a new comment
    shareButton.addEventListener('click', async function () {
        const username = usernameInput.value.trim();
        const comment = commentInput.value.trim();

        if (username && comment) {
            try {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('comment', comment);

                const response = await fetch('/add_comment', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                console.log(result.message);
                usernameInput.value = '';
                commentInput.value = '';
                fetchComments(); // Refresh comments after adding
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        } else {
            alert('Please enter both username and comment.');
        }
    });

    // Function to handle edit and delete actions
    commentsScreen.addEventListener('click', async function (event) {
        const target = event.target;
        const commentItem = target.closest('.comment-item');

        if (!commentItem) return; // Not a comment item

        const commentId = commentItem.getAttribute('data-id');

        if (target.classList.contains('edit-btn')) {
            const currentCommentTextElement = commentItem.querySelector('.comment-text');
            const currentCommentText = currentCommentTextElement.textContent;

            const newComment = prompt('Edit your comment:', currentCommentText);

            if (newComment !== null && newComment.trim() !== '') {
                try {
                    const formData = new FormData();
                    formData.append('comment_id', commentId);
                    formData.append('new_comment', newComment.trim());

                    const response = await fetch('/update_comment', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    console.log(result.message);
                    fetchComments(); // Refresh comments after updating
                } catch (error) {
                    console.error('Error updating comment:', error);
                }
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this comment?')) {
                try {
                    const formData = new FormData();
                    formData.append('comment_id', commentId);

                    const response = await fetch('/delete_comment', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    console.log(result.message);
                    fetchComments(); // Refresh comments after deleting
                } catch (error) {
                    console.error('Error deleting comment:', error);
                }
            }
        }
    });

    fetchComments();

});
function deledit(item) {
    console.log(item.parentNode.querySelectorAll(".comment-actions")[0].style.display)
    if (item.parentNode.querySelectorAll(".comment-actions")[0].style.display == "contents") {
        item.parentNode.querySelectorAll(".comment-actions")[0].style.display = "none";
    }
    else if (item.parentNode.querySelectorAll(".comment-actions")[0].style.display = "none") {
        item.parentNode.querySelectorAll(".comment-actions")[0].style.display = "contents";
    }
}