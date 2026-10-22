// ==============================================================================
// VNnettruyen Client-side Interactions (Diễn Đàn Sáng Tác & Đọc Truyện)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Quản lý Dark / Light Mode toàn website
  const btnDark = document.getElementById('btn-mode-dark');
  const btnLight = document.getElementById('btn-mode-light');
  const htmlRoot = document.documentElement;

  const savedTheme = localStorage.getItem('vnnettruyen_theme') || 'light';
  applyTheme(savedTheme);

  if (btnDark && btnLight) {
    btnDark.addEventListener('click', () => {
      applyTheme('dark');
      localStorage.setItem('vnnettruyen_theme', 'dark');
    });

    btnLight.addEventListener('click', () => {
      applyTheme('light');
      localStorage.setItem('vnnettruyen_theme', 'light');
    });
  }

  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    if (btnDark && btnLight) {
      if (theme === 'dark') {
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
      } else {
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
      }
    }
  }

  // 2. Tìm kiếm nhanh (Quick search with debounce)
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
                <img src="${item.cover_image}" alt="${item.title}" onerror="this.src='/public/images/logo.png'">
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem;">${item.title}</div>
                </div>
              </a>
            `).join('');
            searchResults.classList.add('active');
          } else {
            searchResults.innerHTML = '<div style="padding: 10px; color: var(--text-muted); font-size: 0.82rem; text-align: center;">Không tìm thấy truyện phù hợp</div>';
            searchResults.classList.add('active');
          }
        } catch (err) {
          console.error('Lỗi tìm kiếm:', err);
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
      }
    });
  }

  // 3. Chuyển Tab Bảng Xếp Hạng (Ranking Tabs)
  const rankingTabButtons = document.querySelectorAll('.ranking-tab-btn');
  rankingTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      rankingTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 6. Tùy chỉnh Font size và Màu nền khi đọc chương truyện
  const readerContent = document.getElementById('chapter-reader-content');
  const btnFontIncrease = document.getElementById('btn-font-increase');
  const btnFontDecrease = document.getElementById('btn-font-decrease');
  const themeSelector = document.getElementById('reader-theme-select');

  if (readerContent) {
    let currentFontSize = parseInt(localStorage.getItem('vnnettruyen_font_size') || '18', 10);
    readerContent.style.fontSize = `${currentFontSize}px`;

    if (btnFontIncrease) {
      btnFontIncrease.addEventListener('click', () => {
        if (currentFontSize < 34) {
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
      const savedReaderTheme = localStorage.getItem('vnnettruyen_reader_theme') || 'default';
      applyReaderTheme(savedReaderTheme);
      themeSelector.value = savedReaderTheme;

      themeSelector.addEventListener('change', (e) => {
        applyReaderTheme(e.target.value);
        localStorage.setItem('vnnettruyen_reader_theme', e.target.value);
      });
    }

    function applyReaderTheme(theme) {
      const readerBox = document.querySelector('.reader-box');
      if (!readerBox) return;
      if (theme === 'sepia') {
        readerBox.style.backgroundColor = '#fbf0d9';
        readerBox.style.color = '#5f4b32';
      } else if (theme === 'light') {
        readerBox.style.backgroundColor = '#ffffff';
        readerBox.style.color = '#1f2937';
      } else {
        readerBox.style.backgroundColor = 'var(--bg-card)';
        readerBox.style.color = 'var(--text-main)';
      }
    }
  }

  // 7. AJAX Tủ sách cá nhân (Bookmark toggle)
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


  // 9. Xác nhận xóa
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
