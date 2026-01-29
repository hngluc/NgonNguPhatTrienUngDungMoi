// API URLs
const API_POSTS = 'http://localhost:3000/posts';
const API_COMMENTS = 'http://localhost:3000/comments';

// Global variables
let allPosts = [];
let filteredPosts = [];
let allComments = [];
let currentSort = 'default';

// DOM Elements - Posts
const postsContainer = document.getElementById('postsContainer');
const postForm = document.getElementById('postForm');
const postIdInput = document.getElementById('postId');
const postTitleInput = document.getElementById('postTitle');
const postViewsInput = document.getElementById('postViews');
const postSubmitBtn = document.getElementById('postSubmitBtn');
const postCancelBtn = document.getElementById('postCancelBtn');
const searchPostInput = document.getElementById('searchPost');
const postCount = document.getElementById('postCount');
const deletedCount = document.getElementById('deletedCount');

// DOM Elements - Comments
const commentsContainer = document.getElementById('commentsContainer');
const commentForm = document.getElementById('commentForm');
const commentIdInput = document.getElementById('commentId');
const commentTextInput = document.getElementById('commentText');
const commentPostIdSelect = document.getElementById('commentPostId');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const commentCancelBtn = document.getElementById('commentCancelBtn');
const commentCount = document.getElementById('commentCount');

// ==================== POSTS ====================

// Load all posts
async function loadPosts() {
    try {
        const response = await fetch(API_POSTS);
        allPosts = await response.json();
        filterPosts();
        updatePostSelect(); // Cập nhật dropdown cho comments
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p class="text-danger">Lỗi tải dữ liệu!</p>';
    }
}

// Get max ID from posts
function getMaxPostId() {
    if (allPosts.length === 0) return 0;
    const ids = allPosts.map(p => parseInt(p.id) || 0);
    return Math.max(...ids);
}

// Sort posts
function sortPosts(order) {
    currentSort = order;
    filterPosts();
}

// Filter posts by search term
function filterPosts() {
    const searchTerm = searchPostInput.value.toLowerCase().trim();

    filteredPosts = allPosts.filter(post => {
        return !searchTerm || post.title.toLowerCase().includes(searchTerm);
    });

    // Sort
    if (currentSort === 'views-asc') {
        filteredPosts.sort((a, b) => a.views - b.views);
    } else if (currentSort === 'views-desc') {
        filteredPosts.sort((a, b) => b.views - a.views);
    } else if (currentSort === 'name-az') {
        filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
    }

    renderPosts();
    updatePostCount();
}

// Render posts
function renderPosts() {
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = '<p class="text-secondary text-center">Không có bài viết nào</p>';
        return;
    }

    postsContainer.innerHTML = filteredPosts.map(post => {
        const isDeleted = post.isDeleted === true;
        const deletedClass = isDeleted ? 'deleted' : '';

        return `
            <div class="card card-custom ${deletedClass} mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-secondary me-2">ID: ${post.id}</span>
                            ${isDeleted ? '<span class="badge bg-danger">Đã xóa</span>' : ''}
                        </div>
                    </div>
                    <h6 class="post-title text-white mt-2 mb-1">${post.title}</h6>
                    <small class="post-views text-secondary"><i class="bi bi-eye"></i> ${post.views} views</small>
                    <div class="mt-2 d-flex gap-1">
                        ${isDeleted ? `
                            <button class="btn btn-success btn-sm" onclick="restorePost('${post.id}')">
                                <i class="bi bi-arrow-counterclockwise"></i> Khôi phục
                            </button>
                        ` : `
                            <button class="btn btn-warning btn-sm" onclick="editPost('${post.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="softDeletePost('${post.id}')">
                                <i class="bi bi-trash"></i> Xóa mềm
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update post count
function updatePostCount() {
    const total = allPosts.length;
    const deleted = allPosts.filter(p => p.isDeleted === true).length;
    postCount.textContent = `Tổng: ${filteredPosts.length}/${total} posts`;
    deletedCount.textContent = deleted > 0 ? `🗑️ ${deleted} đã xóa` : '';
}

// Create post - ID tự tăng = maxId + 1, lưu dạng chuỗi
async function createPost(title, views) {
    const newId = String(getMaxPostId() + 1); // ID tự tăng, lưu dạng chuỗi

    const response = await fetch(API_POSTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: newId,
            title: title,
            views: parseInt(views) || 0,
            isDeleted: false
        })
    });

    if (!response.ok) throw new Error('Failed to create post');
    console.log(`Tạo Post mới với ID: ${newId}`);
    return response.json();
}

// Update post
async function updatePost(id, title, views) {
    const response = await fetch(`${API_POSTS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, views: parseInt(views) || 0 })
    });

    if (!response.ok) throw new Error('Failed to update post');
    return response.json();
}

// Soft delete post - Thêm isDeleted: true
async function softDeletePost(id) {
    try {
        const response = await fetch(`${API_POSTS}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: true })
        });

        if (!response.ok) throw new Error('Failed to soft delete');

        // Cập nhật local
        const post = allPosts.find(p => p.id === id);
        if (post) post.isDeleted = true;

        filterPosts();
        console.log(`Post ${id} đã xóa mềm (isDeleted: true)`);
    } catch (error) {
        alert('Lỗi xóa mềm!');
    }
}

// Restore post
async function restorePost(id) {
    try {
        const response = await fetch(`${API_POSTS}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: false })
        });

        if (!response.ok) throw new Error('Failed to restore');

        // Cập nhật local
        const post = allPosts.find(p => p.id === id);
        if (post) post.isDeleted = false;

        filterPosts();
        console.log(`Post ${id} đã khôi phục`);
    } catch (error) {
        alert('Lỗi khôi phục!');
    }
}

// Edit post - Load data vào form
function editPost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;

    postIdInput.value = post.id;
    postTitleInput.value = post.title;
    postViewsInput.value = post.views;
    postSubmitBtn.innerHTML = '<i class="bi bi-save me-1"></i> Cập nhật';
    postCancelBtn.style.display = 'block';
}

// Cancel edit post
function cancelEditPost() {
    postForm.reset();
    postIdInput.value = '';
    postSubmitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Thêm Post';
    postCancelBtn.style.display = 'none';
}

// Post form submit
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = postIdInput.value;
    const title = postTitleInput.value.trim();
    const views = postViewsInput.value;

    try {
        if (id) {
            // Update
            await updatePost(id, title, views);
        } else {
            // Create - ID tự tăng, không cần nhập
            await createPost(title, views);
        }

        cancelEditPost();
        await loadPosts();
    } catch (error) {
        alert('Lỗi lưu post!');
    }
});

// ==================== COMMENTS ====================

// Load all comments
async function loadComments() {
    try {
        const response = await fetch(API_COMMENTS);
        allComments = await response.json();
        renderComments();
        updateCommentCount();
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsContainer.innerHTML = '<p class="text-danger">Lỗi tải dữ liệu!</p>';
    }
}

// Get max ID from comments
function getMaxCommentId() {
    if (allComments.length === 0) return 0;
    const ids = allComments.map(c => parseInt(c.id) || 0);
    return Math.max(...ids);
}

// Update post select dropdown
function updatePostSelect() {
    const activePosts = allPosts.filter(p => !p.isDeleted);
    commentPostIdSelect.innerHTML = '<option value="">-- Chọn Post --</option>' +
        activePosts.map(p => `<option value="${p.id}">${p.id} - ${p.title}</option>`).join('');
}

// Render comments
function renderComments() {
    if (allComments.length === 0) {
        commentsContainer.innerHTML = '<p class="text-secondary text-center">Không có comment nào</p>';
        return;
    }

    commentsContainer.innerHTML = allComments.map(comment => {
        const post = allPosts.find(p => p.id === comment.postId);
        const postTitle = post ? post.title : 'Unknown';

        return `
            <div class="comment-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="badge bg-secondary">ID: ${comment.id}</span>
                        <span class="badge bg-info ms-1">Post: ${comment.postId}</span>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm py-0 px-1" onclick="editComment('${comment.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm py-0 px-1" onclick="deleteComment('${comment.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-white mb-1 mt-2">${comment.text}</p>
                <small class="text-secondary">→ ${postTitle}</small>
            </div>
        `;
    }).join('');
}

// Update comment count
function updateCommentCount() {
    commentCount.textContent = `Tổng: ${allComments.length} comments`;
}

// Create comment - ID tự tăng
async function createComment(text, postId) {
    const newId = String(getMaxCommentId() + 1); // ID tự tăng, lưu dạng chuỗi

    const response = await fetch(API_COMMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: newId,
            text: text,
            postId: postId
        })
    });

    if (!response.ok) throw new Error('Failed to create comment');
    console.log(`Tạo Comment mới với ID: ${newId}`);
    return response.json();
}

// Update comment
async function updateComment(id, text, postId) {
    const response = await fetch(`${API_COMMENTS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, postId })
    });

    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
}

// Delete comment (xóa cứng)
async function deleteComment(id) {
    if (!confirm('Bạn có chắc muốn xóa comment này?')) return;

    try {
        const response = await fetch(`${API_COMMENTS}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete comment');

        console.log(`Comment ${id} đã bị xóa`);
        await loadComments();
    } catch (error) {
        alert('Lỗi xóa comment!');
    }
}

// Edit comment - Load data vào form
function editComment(id) {
    const comment = allComments.find(c => c.id === id);
    if (!comment) return;

    commentIdInput.value = comment.id;
    commentTextInput.value = comment.text;
    commentPostIdSelect.value = comment.postId;
    commentSubmitBtn.innerHTML = '<i class="bi bi-save me-1"></i> Cập nhật';
    commentCancelBtn.style.display = 'block';
}

// Cancel edit comment
function cancelEditComment() {
    commentForm.reset();
    commentIdInput.value = '';
    commentSubmitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Thêm Comment';
    commentCancelBtn.style.display = 'none';
}

// Comment form submit
commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = commentIdInput.value;
    const text = commentTextInput.value.trim();
    const postId = commentPostIdSelect.value;

    try {
        if (id) {
            // Update
            await updateComment(id, text, postId);
        } else {
            // Create - ID tự tăng
            await createComment(text, postId);
        }

        cancelEditComment();
        await loadComments();
    } catch (error) {
        alert('Lỗi lưu comment!');
    }
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    await loadComments();
});
