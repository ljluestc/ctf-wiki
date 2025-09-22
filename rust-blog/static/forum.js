// Forum JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeForum();
});

function initializeForum() {
    // Initialize user menu toggle
    initializeUserMenu();

    // Initialize search functionality
    initializeSearch();

    // Initialize real-time features
    initializeRealTime();

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();

    // Initialize lazy loading
    initializeLazyLoading();
}

// User Menu
function initializeUserMenu() {
    const userAvatar = document.querySelector('.user-avatar');
    const userDropdown = document.getElementById('userDropdown');

    if (userAvatar && userDropdown) {
        userAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.style.display = 'none';
        });
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();

            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            } else if (searchResults) {
                searchResults.style.display = 'none';
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && searchResults && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
}

async function performSearch(query) {
    try {
        const response = await fetch(`/api/forum/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();

        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    const searchResults = document.querySelector('.search-results');
    if (!searchResults) return;

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">No results found</div>';
    } else {
        const resultsHtml = results.map(result => `
            <div class="search-result-item">
                <a href="${result.url}" class="search-result-link">
                    <h4 class="search-result-title">${escapeHtml(result.title)}</h4>
                    <p class="search-result-snippet">${escapeHtml(result.snippet)}</p>
                    <span class="search-result-type">${result.type}</span>
                </a>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHtml;
    }

    searchResults.style.display = 'block';
}

// Real-time features
function initializeRealTime() {
    // Check for new replies every 30 seconds when viewing a topic
    if (window.location.pathname.includes('/forum/t/')) {
        setInterval(checkForNewReplies, 30000);
    }

    // Update last seen timestamp
    updateLastSeen();
    setInterval(updateLastSeen, 60000); // Every minute
}

async function checkForNewReplies() {
    const topicSlug = window.location.pathname.split('/').pop();
    const lastReplyElement = document.querySelector('.reply-item:last-child');

    if (!lastReplyElement) return;

    const lastReplyId = lastReplyElement.id.replace('reply-', '');

    try {
        const response = await fetch(`/api/forum/topics/${topicSlug}/replies?after=${lastReplyId}`);
        const newReplies = await response.json();

        if (newReplies.length > 0) {
            showNewRepliesNotification(newReplies.length);
        }
    } catch (error) {
        console.error('Error checking for new replies:', error);
    }
}

function showNewRepliesNotification(count) {
    const notification = document.createElement('div');
    notification.className = 'new-replies-notification';
    notification.innerHTML = `
        <span class="notification-text">${count} new ${count === 1 ? 'reply' : 'replies'}</span>
        <button class="notification-action" onclick="reloadPage()">Refresh</button>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

function reloadPage() {
    window.location.reload();
}

async function updateLastSeen() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch('/api/forum/update-last-seen', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error updating last seen:', error);
    }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'c':
                if (e.ctrlKey || e.metaKey) return; // Don't interfere with copy
                const createButton = document.querySelector('[href="/forum/create"]');
                if (createButton) createButton.click();
                break;

            case 's':
                if (e.ctrlKey || e.metaKey) return; // Don't interfere with save
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                    e.preventDefault();
                }
                break;

            case 'r':
                if (e.ctrlKey || e.metaKey) return; // Don't interfere with refresh
                const replyButton = document.querySelector('[onclick="scrollToReplyForm()"]');
                if (replyButton) replyButton.click();
                break;

            case 'Escape':
                // Close modals, dropdowns, etc.
                const userDropdown = document.getElementById('userDropdown');
                if (userDropdown) userDropdown.style.display = 'none';

                const searchResults = document.querySelector('.search-results');
                if (searchResults) searchResults.style.display = 'none';
                break;
        }
    });
}

// Lazy loading for images and content
function initializeLazyLoading() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Lazy load topic content on category pages
    const topicItems = document.querySelectorAll('.topic-item[data-load-content]');
    const contentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadTopicPreview(entry.target);
            }
        });
    });

    topicItems.forEach(item => contentObserver.observe(item));
}

async function loadTopicPreview(topicElement) {
    const topicId = topicElement.dataset.topicId;
    if (!topicId) return;

    try {
        const response = await fetch(`/api/forum/topics/${topicId}/preview`);
        const preview = await response.json();

        const previewElement = topicElement.querySelector('.topic-preview');
        if (previewElement) {
            previewElement.innerHTML = preview.content;
        }
    } catch (error) {
        console.error('Error loading topic preview:', error);
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;

    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    if (diff < minute) {
        return 'just now';
    } else if (diff < hour) {
        const minutes = Math.floor(diff / minute);
        return `${minutes}m ago`;
    } else if (diff < day) {
        const hours = Math.floor(diff / hour);
        return `${hours}h ago`;
    } else if (diff < week) {
        const days = Math.floor(diff / day);
        return `${days}d ago`;
    } else if (diff < month) {
        const weeks = Math.floor(diff / week);
        return `${weeks}w ago`;
    } else if (diff < year) {
        const months = Math.floor(diff / month);
        return `${months}mo ago`;
    } else {
        const years = Math.floor(diff / year);
        return `${years}y ago`;
    }
}

// Update timestamps on the page
function updateTimestamps() {
    const timeElements = document.querySelectorAll('[data-timestamp]');
    timeElements.forEach(element => {
        const timestamp = element.dataset.timestamp;
        element.textContent = formatTimeAgo(timestamp);
    });
}

// Update timestamps every minute
setInterval(updateTimestamps, 60000);

// Topic and reply interactions
async function likeTopic(topicId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginPrompt();
        return;
    }

    try {
        const response = await fetch(`/api/forum/topics/${topicId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            updateLikeButton(topicId, result.liked, result.count);
        } else {
            throw new Error('Failed to like topic');
        }
    } catch (error) {
        console.error('Error liking topic:', error);
        showNotification('Failed to like topic', 'error');
    }
}

async function likeReply(replyId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginPrompt();
        return;
    }

    try {
        const response = await fetch(`/api/forum/replies/${replyId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            updateLikeButton(replyId, result.liked, result.count);
        } else {
            throw new Error('Failed to like reply');
        }
    } catch (error) {
        console.error('Error liking reply:', error);
        showNotification('Failed to like reply', 'error');
    }
}

function updateLikeButton(id, liked, count) {
    const button = document.querySelector(`[onclick*="${id}"]`);
    if (button) {
        const countElement = button.querySelector('.count');
        if (countElement) {
            countElement.textContent = count;
        }

        if (liked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
    }
}

function showLoginPrompt() {
    if (confirm('You need to be logged in to perform this action. Would you like to log in?')) {
        window.location.href = '/login';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Form enhancements
function autoGrowTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Auto-grow textareas
document.addEventListener('input', function(e) {
    if (e.target.tagName === 'TEXTAREA') {
        autoGrowTextarea(e.target);
    }
});

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });

    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);

    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
    field.classList.add('field-invalid');
}

function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.classList.remove('field-invalid');
}

// Enhanced form submission
document.addEventListener('submit', function(e) {
    const form = e.target;

    if (form.classList.contains('forum-form')) {
        if (!validateForm(form)) {
            e.preventDefault();
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="loading-spinner"></span> Submitting...';
            submitButton.disabled = true;

            // Restore button state if form submission fails
            setTimeout(() => {
                if (submitButton.disabled) {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                }
            }, 10000);
        }
    }
});

// Analytics and tracking
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Track forum interactions
document.addEventListener('click', function(e) {
    const target = e.target.closest('a, button');
    if (!target) return;

    // Track topic clicks
    if (target.closest('.topic-item')) {
        trackEvent('Forum', 'topic_click', target.textContent.trim());
    }

    // Track category clicks
    if (target.closest('.category-card')) {
        trackEvent('Forum', 'category_click', target.textContent.trim());
    }

    // Track reply interactions
    if (target.classList.contains('reply-action')) {
        trackEvent('Forum', 'reply_action', target.textContent.trim());
    }
});

console.log('Forum JavaScript initialized');

// Export functions for global use
window.forumJS = {
    toggleUserMenu,
    performSearch,
    likeTopic,
    likeReply,
    showNotification,
    trackEvent
};