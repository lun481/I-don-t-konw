// =============================================
// 小蛋留言板 - 主脚本
// =============================================

const STORAGE_KEY = 'eggBoardComments';
const INITIAL_DEMO = [
   
];

// 加载评论数据
function loadComments() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return [...INITIAL_DEMO];
}

// 保存评论数据
function saveComments(comments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

// 生成唯一ID
function generateId(comments) {
    if (comments.length === 0) return 1;
    return Math.max(...comments.map(c => c.id)) + 1;
}

// 格式化时间
function formatTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 渲染评论列表
function renderComments(comments, selectedSection) {
    const commentsList = document.getElementById('comments-list');
    const emptyState = document.getElementById('empty-state');
    const sectionSelect = document.getElementById('section-select');
    
    commentsList.innerHTML = '';
    
    let filteredComments = comments;
    
    if (selectedSection !== '全部') {
        filteredComments = comments.filter(comment => comment.section === selectedSection);
    }
    
    if (filteredComments.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }
    
    filteredComments.forEach(comment => {
        const commentCard = document.createElement('div');
        commentCard.className = 'comment-card';
        
        commentCard.innerHTML = `
            <div class="comment-header">
                <div class="avatar">${comment.avatar}</div>
                <div class="comment-meta">
                    <div class="comment-author">${comment.nickname}</div>
                    <div class="comment-time">${comment.time}</div>
                    <div class="comment-section">📌 ${comment.section}</div>
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="like-btn" data-id="${comment.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 001.962-1.77l.5-9a2 2 0 00-1.992-2.18h-0.38l-.96-3.12A2 2 0 0014 9z"/>
                    </svg>
                    <span class="like-count">${comment.likes}</span>
                </button>
            </div>
        `;
        
        commentsList.appendChild(commentCard);
    });
    
    // 添加点赞事件
    addLikeEvents();
}

// 添加点赞事件
function addLikeEvents() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const comments = loadComments();
            const comment = comments.find(c => c.id === id);
            
            if (comment) {
                if (comment.liked) {
                    comment.likes--;
                    comment.liked = false;
                    this.classList.remove('liked');
                } else {
                    comment.likes++;
                    comment.liked = true;
                    this.classList.add('liked');
                }
                this.querySelector('.like-count').textContent = comment.likes;
                saveComments(comments);
                // 重新渲染确保状态同步
                renderComments(comments, document.getElementById('section-select').value);
            }
        });
    });
}

// 验证表单
function validateForm(nickname, content) {
    const nicknameCount = document.getElementById('nickname-count');
    const contentCount = document.getElementById('content-count');
    
    // 昵称验证
    if (nickname.trim().length === 0) {
        alert('请输入昵称哦~');
        return false;
    }
    if (nickname.length > 10) {
        alert('昵称不能超过10个字符！');
        return false;
    }
    
    // 内容验证
    if (content.trim().length === 0) {
        alert('留言内容不能为空！');
        return false;
    }
    if (content.length > 200) {
        alert('留言内容不能超过200个字符！');
        return false;
    }
    
    return true;
}

// 提交表单
function handleFormSubmit(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('nickname').value.trim();
    const content = document.getElementById('content').value.trim();
    const section = document.getElementById('section').value;
    
    if (!validateForm(nickname, content)) {
        return;
    }
    
    const comments = loadComments();
    const newComment = {
        id: generateId(comments),
        nickname: nickname,
        content: content,
        section: section,
        time: formatTime(),
        avatar: getRandomAvatar(),
        likes: 0,
        liked: false
    };
    
    comments.unshift(newComment);
    saveComments(comments);
    
    // 清空表单
    document.getElementById('nickname').value = '';
    document.getElementById('content').value = '';
    document.getElementById('nickname-count').textContent = '0/10';
    document.getElementById('content-count').textContent = '0/200';
    
    // 重新渲染
    renderComments(comments, document.getElementById('section-select').value);
    
    // 提示
    showToast('✅ 留言发表成功！');
}

// 随机头像
function getRandomAvatar() {
    const avatars = ['👋', '💻', '🧠', '🎉', '😊', '🌟', '🐱', '🐶', '🐹', '🦊'];
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
}

// 清空所有数据
function resetAllData() {
    if (confirm('确定要清空所有留言数据吗？此操作不可恢复！')) {
        localStorage.removeItem(STORAGE_KEY);
        const comments = [...INITIAL_DEMO];
        saveComments(comments);
        renderComments(comments, '全部');
        showToast('🗑️ 所有数据已清空');
    }
}

// 重置为示例数据
function resetDemoData() {
    if (confirm('确定要重置为示例数据吗？')) {
        const comments = [...INITIAL_DEMO];
        saveComments(comments);
        renderComments(comments, '全部');
        showToast('🌟 成功加载示例留言');
    }
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 14px 28px;
        border-radius: 9999px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-size: 1rem;
        white-space: nowrap;
        animation: toastPop 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// 初始化
function init() {
    // 加载评论
    const comments = loadComments();
    
    // 渲染初始列表
    renderComments(comments, '全部');
    
    // 表单事件
    const form = document.getElementById('comment-form');
    form.addEventListener('submit', handleFormSubmit);
    
    // 板块筛选
    const sectionSelect = document.getElementById('section-select');
    sectionSelect.addEventListener('change', function() {
        renderComments(comments, this.value);
    });
    
    // 清空数据按钮
    document.getElementById('reset-btn').addEventListener('click', resetAllData);
    
    // 重置示例按钮
    document.getElementById('reset-demo-btn').addEventListener('click', resetDemoData);
    
    // 字符计数
    const nicknameInput = document.getElementById('nickname');
    const contentInput = document.getElementById('content');
    
    function updateCounts() {
        const nCount = nicknameInput.value.length;
        const cCount = contentInput.value.length;
        document.getElementById('nickname-count').textContent = `${nCount}/10`;
        document.getElementById('content-count').textContent = `${cCount}/200`;
    }
    
    nicknameInput.addEventListener('input', updateCounts);
    contentInput.addEventListener('input', updateCounts);
    
    // 初始化计数
    updateCounts();
    
    // 欢迎提示
    setTimeout(() => {
        showToast('👋 欢迎来留言板！');
    }, 800);
}

// 启动应用
window.onload = init;
