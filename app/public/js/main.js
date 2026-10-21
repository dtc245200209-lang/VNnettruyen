// ==========================================
// VNnettruyen Client-side Interactions
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tìm kiếm nhanh (Quick search with debounce)
  const searchInput = document.getElementById('navbar-search-input');
  const searchResults = document.getElementById('navbar-search-results');

  let debounceTimer;
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (query.length < 2) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();

          if (data && data.length > 0) {
            searchResults.innerHTML = data.map(item => `
              <a href="/stories/${item.slug}" class="search-item">
                <img src="${item.cover_image}" alt="${item.title}">
                <div class="search-item-title">${item.title}</div>
              </a>
            `).join('');
            searchResults.classList.add('active');
          } else {
            searchResults.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 0.85rem; text-align: center;">Không tìm thấy truyện phù hợp</div>';
            searchResults.classList.add('active');
          }
        } catch (err) {
          console.error('Lỗi tìm kiếm:', err);
        }
      }, 300);
    });

    // Ẩn dropdown khi click bên ngoài
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
      }
    });
  }

  // 2. Chức năng tùy chỉnh giao diện đọc truyện (Font size, nền đọc)
  const readerContent = document.getElementById('chapter-reader-content');
  const btnFontIncrease = document.getElementById('btn-font-increase');
  const btnFontDecrease = document.getElementById('btn-font-decrease');
  const themeSelector = document.getElementById('reader-theme-select');

  if (readerContent) {
    let currentFontSize = parseInt(localStorage.getItem('vnnettruyen_font_size') || '18', 10);
    readerContent.style.fontSize = `${currentFontSize}px`;

    if (btnFontIncrease) {
      btnFontIncrease.addEventListener('click', () => {
        if (currentFontSize < 32) {
          currentFontSize += 2;
          readerContent.style.fontSize = `${currentFontSize}px`;
          localStorage.setItem('vnnettruyen_font_size', currentFontSize);
        }
      });
    }

    if (btnFontDecrease) {
      btnFontDecrease.addEventListener('click', () => {
        if (currentFontSize > 14) {
          currentFontSize -= 2;
          readerContent.style.fontSize = `${currentFontSize}px`;
          localStorage.setItem('vnnettruyen_font_size', currentFontSize);
        }
      });
    }

    if (themeSelector) {
      const savedTheme = localStorage.getItem('vnnettruyen_reader_theme') || 'dark';
      applyReaderTheme(savedTheme);
      themeSelector.value = savedTheme;

      themeSelector.addEventListener('change', (e) => {
        applyReaderTheme(e.target.value);
        localStorage.setItem('vnnettruyen_reader_theme', e.target.value);
      });
    }

    function applyReaderTheme(theme) {
      const readerWrapper = document.querySelector('.reader-wrapper');
      if (!readerWrapper) return;
      if (theme === 'sepia') {
        readerWrapper.style.backgroundColor = '#fbf0d9';
        readerWrapper.style.color = '#5f4b32';
      } else if (theme === 'light') {
        readerWrapper.style.backgroundColor = '#ffffff';
        readerWrapper.style.color = '#1f2937';
      } else {
        readerWrapper.style.backgroundColor = 'var(--bg-secondary)';
        readerWrapper.style.color = 'var(--text-primary)';
      }
    }
  }

  // 3. AJAX Thêm/Xóa tủ sách (Bookmark toggle)
  const bookmarkBtn = document.getElementById('btn-bookmark-toggle');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const storyId = bookmarkBtn.getAttribute('data-story-id');

      try {
        const res = await fetch('/bookmark/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ storyId })
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        const data = await res.json();
        if (data.success) {
          if (data.bookmarked) {
            bookmarkBtn.classList.remove('btn-secondary');
            bookmarkBtn.classList.add('btn-primary');
            bookmarkBtn.innerHTML = '❤️ Đã lưu vào tủ sách';
          } else {
            bookmarkBtn.classList.remove('btn-primary');
            bookmarkBtn.classList.add('btn-secondary');
            bookmarkBtn.innerHTML = '🤍 Thêm vào tủ sách';
          }
        }
      } catch (err) {
        console.error('Lỗi khi thao tác tủ sách:', err);
      }
    });
  }

  // 4. Xác nhận các thao tác xóa quan trọng
  const deleteForms = document.querySelectorAll('.confirm-delete');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const confirmMsg = form.getAttribute('data-confirm-message') || 'Bạn có chắc chắn muốn xóa mục này? Thao tác không thể hoàn tác!';
      if (!confirm(confirmMsg)) {
        e.preventDefault();
      }
    });
  });
});
