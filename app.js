// Global variables
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentCategory = 'all';
let currentSort = 'default'; // 'default', 'asc', 'desc'

// Sort products by price
function sortProducts(order) {
    currentSort = order;
    filterAndRender();
}

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const categoryTabs = document.getElementById('categoryTabs');
const searchInput = document.getElementById('searchInput');
const productCount = document.getElementById('productCount');

// Load data from db.json
async function loadData() {
    try {
        const response = await fetch('db.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        allProducts = await response.json();

        // Extract unique categories
        extractCategories();

        // Render category tabs
        renderCategoryTabs();

        // Initial render
        filterAndRender();

    } catch (error) {
        console.error('Error loading data:', error);
        productsGrid.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3>Không thể tải dữ liệu</h3>
                <p>Vui lòng kiểm tra file db.json</p>
            </div>
        `;
    }
}

// Extract unique categories from products
function extractCategories() {
    const categoryMap = new Map();
    allProducts.forEach(product => {
        if (product.category && !categoryMap.has(product.category.id)) {
            categoryMap.set(product.category.id, product.category);
        }
    });
    categories = Array.from(categoryMap.values());
}

// Render category tabs
function renderCategoryTabs() {
    let tabsHTML = `<button class="category-tab active" data-category="all">Tất cả</button>`;

    categories.forEach(cat => {
        tabsHTML += `<button class="category-tab" data-category="${cat.id}">${cat.name}</button>`;
    });

    categoryTabs.innerHTML = tabsHTML;

    // Add event listeners
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            filterAndRender();
        });
    });
}

// Filter and render products
function filterAndRender() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    filteredProducts = allProducts.filter(product => {
        // Filter by category
        const categoryMatch = currentCategory === 'all' ||
            (product.category && product.category.id.toString() === currentCategory);

        // Filter by search term (only search by title - name)
        const searchMatch = !searchTerm ||
            product.title.toLowerCase().includes(searchTerm);

        return categoryMatch && searchMatch;
    });

    // Sort products by price
    if (currentSort === 'asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts();
    updateProductCount();
}

// Render products to grid
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Create product card HTML
function createProductCard(product) {
    const imageUrl = product.images && product.images[0]
        ? product.images[0]
        : 'https://placehold.co/600x400/1a1a2e/ffffff?text=No+Image';

    const categoryName = product.category ? product.category.name : 'Uncategorized';

    return `
        <article class="product-card">
            <img 
                src="${imageUrl}" 
                alt="${product.title}" 
                class="product-image"
                onerror="this.src='https://placehold.co/600x400/1a1a2e/ffffff?text=No+Image'"
            >
            <div class="product-info">
                <span class="product-category">${categoryName}</span>
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">$${product.price}</span>
                    <button class="add-to-cart" title="Thêm vào giỏ hàng">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Update product count display
function updateProductCount() {
    const categoryText = currentCategory === 'all'
        ? ''
        : ` trong ${categories.find(c => c.id.toString() === currentCategory)?.name || ''}`;

    productCount.textContent = `Hiển thị ${filteredProducts.length} / ${allProducts.length} sản phẩm${categoryText}`;
}

// Event listeners
searchInput.addEventListener('input', debounce(filterAndRender, 300));

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', loadData);
