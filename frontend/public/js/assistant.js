(function () {
    if (document.getElementById('nova-assistant-btn')) return;

    var history = [];
    var isOpen = false;
    var isLoading = false;

    function getLang() {
        try {
            var stored = localStorage.getItem('language');
            if (stored && typeof stored === 'string') {
                return stored.toLowerCase().startsWith('en') ? 'en' : 'uk';
            }
        } catch {}
        var htmlLang = document.documentElement.lang || '';
        return htmlLang.toLowerCase().startsWith('en') ? 'en' : 'uk';
    }

    function getCurrentProductContext() {
        var hash = window.location.hash || '';
        var match = hash.match(/#\/product\/(\d+)/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        return null;
    }

    var i18n = {
        uk: {
            title: 'Нова',
            triggerLabel: 'Чат з асистентом Нова',
            closeLabel: 'Закрити',
            clearLabel: 'Почати заново',
            status: 'В мережі',
            placeholder: 'Запитайте про товари NovaShop...',
            sendLabel: 'Надіслати',
            micLabel: 'Голосове введення',
            typing: 'Нова пише...',
            greeting: 'Вітаю! Я Нова — ваш персональний AI-помічник NovaShop. Підкажу інформацію про товари, характеристики, доставку та оплату.',
            errorReply: 'Вибачте, виникла помилка відповіді.',
            networkError: 'Не вдалося зв\'язатися з сервером. Перевірте підключення до мережі.'
        },
        en: {
            title: 'Nova',
            triggerLabel: 'Chat with Nova Assistant',
            closeLabel: 'Close',
            clearLabel: 'Start over',
            status: 'Online',
            placeholder: 'Ask about NovaShop products...',
            sendLabel: 'Send',
            micLabel: 'Voice input',
            typing: 'Nova is typing...',
            greeting: 'Hello! I am Nova — your personal AI shopping assistant at NovaShop. How can I help you find gadgets, discounts, or delivery details?',
            errorReply: 'Sorry, an error occurred while processing the response.',
            networkError: 'Unable to connect to the server. Please check your network connection.'
        }
    };

    var triggerBtn = document.createElement('button');
    triggerBtn.id = 'nova-assistant-btn';
    triggerBtn.className = 'nova-assistant-trigger';
    triggerBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

    var chatWindow = document.createElement('div');
    chatWindow.id = 'nova-assistant-window';
    chatWindow.className = 'nova-assistant-window';

    var header = document.createElement('div');
    header.className = 'nova-assistant-header';

    var brand = document.createElement('div');
    brand.className = 'nova-assistant-brand';

    var avatar = document.createElement('div');
    avatar.className = 'nova-assistant-avatar';
    avatar.innerHTML = '<img src="/images/nova-portrait.jpg" alt="Nova" class="nova-avatar-img" onerror="this.onerror=null;this.parentElement.innerHTML=\'<i class=\\\'fa-solid fa-robot\\\'></i>\';" />';

    var titlesWrap = document.createElement('div');
    var title = document.createElement('div');
    title.className = 'nova-assistant-title';

    var status = document.createElement('div');
    status.className = 'nova-assistant-status';
    var statusDot = document.createElement('span');
    statusDot.className = 'nova-status-dot';
    var statusText = document.createElement('span');
    statusText.textContent = 'В мережі';
    status.appendChild(statusDot);
    status.appendChild(statusText);

    titlesWrap.appendChild(title);
    titlesWrap.appendChild(status);

    brand.appendChild(avatar);
    brand.appendChild(titlesWrap);

    var headerActions = document.createElement('div');
    headerActions.style.display = 'flex';
    headerActions.style.alignItems = 'center';
    headerActions.style.gap = '6px';

    var resetBtn = document.createElement('button');
    resetBtn.className = 'nova-assistant-close';
    resetBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
    resetBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        history = [];
        messagesList.innerHTML = '';
        renderInitialGreeting();
    });

    var closeBtn = document.createElement('button');
    closeBtn.className = 'nova-assistant-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    headerActions.appendChild(resetBtn);
    headerActions.appendChild(closeBtn);

    header.appendChild(brand);
    header.appendChild(headerActions);

    var messagesList = document.createElement('div');
    messagesList.className = 'nova-assistant-messages';

    var form = document.createElement('form');
    form.className = 'nova-assistant-form';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'nova-assistant-input';
    input.maxLength = 500;
    input.autocomplete = 'off';

    var micBtn = document.createElement('button');
    micBtn.type = 'button';
    micBtn.className = 'nova-assistant-mic';
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';

    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    var isListening = false;
    if (SpeechRec) {
        try {
            recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = function () {
                isListening = true;
                micBtn.classList.add('listening');
            };

            recognition.onresult = function (event) {
                var transcript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript;
                }
                if (transcript) {
                    input.value = transcript;
                    input.focus();
                }
            };

            recognition.onerror = function () {
                isListening = false;
                micBtn.classList.remove('listening');
            };

            recognition.onend = function () {
                isListening = false;
                micBtn.classList.remove('listening');
            };

            micBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (isListening) {
                    recognition.stop();
                } else {
                    var lang = getLang();
                    recognition.lang = lang === 'en' ? 'en-US' : 'uk-UA';
                    try {
                        recognition.start();
                    } catch {
                        recognition.stop();
                    }
                }
            });
        } catch {
            micBtn.style.display = 'none';
        }
    } else {
        micBtn.style.display = 'none';
    }

    var sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'nova-assistant-send';
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

    form.appendChild(input);
    form.appendChild(micBtn);
    form.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesList);
    chatWindow.appendChild(form);

    document.body.appendChild(triggerBtn);
    document.body.appendChild(chatWindow);

    function updateTexts() {
        var lang = getLang();
        var texts = i18n[lang] || i18n.uk;
        title.textContent = texts.title;
        statusText.textContent = texts.status;
        input.placeholder = texts.placeholder;
        triggerBtn.setAttribute('aria-label', texts.triggerLabel);
        closeBtn.setAttribute('aria-label', texts.closeLabel);
        resetBtn.setAttribute('aria-label', texts.clearLabel);
        resetBtn.title = texts.clearLabel;
        micBtn.setAttribute('aria-label', texts.micLabel);
        micBtn.title = texts.micLabel;
        sendBtn.setAttribute('aria-label', texts.sendLabel);
        if (typingLabel) typingLabel.textContent = texts.typing;
    }

    function formatMessageHtml(text) {
        var safe = String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\[([^\]]+)\]\((#[^)\s]+|\/[^)\s]+)\)/g, function (match, title, url) {
            return '<a href="' + url + '" class="nova-chat-link">' + title + '</a>';
        });
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }

    function addMessage(role, text) {
        var msg = document.createElement('div');
        msg.className = role === 'user' ? 'nova-msg nova-msg-user' : 'nova-msg nova-msg-bot';
        if (role === 'user') {
            msg.textContent = text;
        } else {
            msg.innerHTML = formatMessageHtml(text);
        }
        messagesList.appendChild(msg);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function addChips(suggestions) {
        if (!Array.isArray(suggestions) || !suggestions.length) return;
        var wrap = document.createElement('div');
        wrap.className = 'nova-chips';
        suggestions.forEach(function (s) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'nova-chip';
            chip.textContent = s;
            chip.addEventListener('click', function () {
                input.value = s;
                form.dispatchEvent(new Event('submit'));
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            });
            wrap.appendChild(chip);
        });
        messagesList.appendChild(wrap);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function addComparisonCards(comparison) {
        if (!Array.isArray(comparison) || comparison.length < 2) return;
        var wrap = document.createElement('div');
        wrap.className = 'nova-comparison-wrap';

        var lang = getLang();
        var headerTitle = lang === 'en' ? '⚖️ Product Comparison' : '⚖️ Порівняння товарів';
        var addText = lang === 'en' ? 'Add' : 'В кошик';
        var addedText = lang === 'en' ? 'Added' : 'Додано';

        var headerEl = document.createElement('div');
        headerEl.className = 'nova-comparison-header';
        headerEl.textContent = headerTitle;
        wrap.appendChild(headerEl);

        var grid = document.createElement('div');
        grid.className = 'nova-comparison-grid';

        comparison.slice(0, 2).forEach(function (p) {
            var col = document.createElement('div');
            col.className = 'nova-compare-col';

            var imgUrl = p.thumbnail || '/images/banner.png';
            var rating = p.avg_rating ? Number(p.avg_rating).toFixed(1) : '5.0';
            var priceFormatted = '$' + Number(p.price).toFixed(2);
            var safeTitle = String(p.title || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            col.innerHTML =
                '<div class="nova-compare-thumb"><img src="' + imgUrl + '" alt="" onerror="this.src=\'/images/banner.png\';" /></div>' +
                '<a href="#/product/' + p.id + '" class="nova-compare-title" title="' + safeTitle + '">' + safeTitle + '</a>' +
                '<div class="nova-compare-meta">' +
                    '<span class="nova-compare-price">' + priceFormatted + '</span>' +
                    '<span class="nova-compare-rating">★ ' + rating + '</span>' +
                '</div>' +
                '<button type="button" class="nova-compare-buy-btn" data-id="' + p.id + '">' +
                    '<i class="fa-solid fa-cart-plus"></i> ' + addText +
                '</button>';

            var buyBtn = col.querySelector('.nova-compare-buy-btn');
            buyBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('novashop:add-to-cart', { detail: { id: p.id, quantity: 1 } }));
                buyBtn.classList.add('added');
                buyBtn.innerHTML = '<i class="fa-solid fa-check"></i> ' + addedText;
                setTimeout(function () {
                    buyBtn.classList.remove('added');
                    buyBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> ' + addText;
                }, 2200);
            });

            grid.appendChild(col);
        });

        wrap.appendChild(grid);
        messagesList.appendChild(wrap);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function addProductCards(products) {
        if (!Array.isArray(products) || !products.length) return;
        var container = document.createElement('div');
        container.className = 'nova-product-cards';

        var lang = getLang();
        var addText = lang === 'en' ? 'Add' : 'В кошик';
        var addedText = lang === 'en' ? 'Added' : 'Додано';

        products.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'nova-product-card';

            var imgUrl = p.thumbnail || '/images/banner.png';
            var rating = p.avg_rating ? Number(p.avg_rating).toFixed(1) : '5.0';
            var priceFormatted = '$' + Number(p.price).toFixed(2);

            var safeTitle = String(p.title || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            card.innerHTML =
                '<div class="nova-card-thumb"><img src="' + imgUrl + '" alt="" onerror="this.src=\'/images/banner.png\';" /></div>' +
                '<div class="nova-card-info">' +
                    '<a href="#/product/' + p.id + '" class="nova-card-title" title="' + safeTitle + '">' + safeTitle + '</a>' +
                    '<div class="nova-card-meta">' +
                        '<span class="nova-card-price">' + priceFormatted + '</span>' +
                        '<span class="nova-card-rating">★ ' + rating + '</span>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="nova-card-buy-btn" data-id="' + p.id + '">' +
                    '<i class="fa-solid fa-cart-plus"></i> ' + addText +
                '</button>';

            var buyBtn = card.querySelector('.nova-card-buy-btn');
            buyBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('novashop:add-to-cart', { detail: { id: p.id, quantity: 1 } }));
                buyBtn.classList.add('added');
                buyBtn.innerHTML = '<i class="fa-solid fa-check"></i> ' + addedText;
                setTimeout(function () {
                    buyBtn.classList.remove('added');
                    buyBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> ' + addText;
                }, 2200);
            });

            container.appendChild(card);
        });

        messagesList.appendChild(container);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    var typingIndicator = document.createElement('div');
    typingIndicator.className = 'nova-typing';
    var dots = document.createElement('div');
    dots.className = 'nova-typing-dots';
    dots.appendChild(document.createElement('span'));
    dots.appendChild(document.createElement('span'));
    dots.appendChild(document.createElement('span'));
    var typingLabel = document.createElement('span');
    typingIndicator.appendChild(dots);
    typingIndicator.appendChild(typingLabel);

    function showTyping() {
        if (!messagesList.contains(typingIndicator)) {
            messagesList.appendChild(typingIndicator);
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    }

    function hideTyping() {
        if (messagesList.contains(typingIndicator)) {
            messagesList.removeChild(typingIndicator);
        }
    }

    function renderInitialGreeting() {
        var currentLang = getLang();
        var prodId = getCurrentProductContext();

        if (prodId) {
            var prodTitle = (document.querySelector('.nv-page-title, .product-title, h1') || {}).textContent || '';
            addMessage('model', currentLang === 'en'
                ? 'Hello! I see you are looking at **' + (prodTitle.trim() || 'this item') + '**. Would you like to know more about its specs, warranty, or see alternatives?'
                : 'Вітаю! Бачу, ви дивитесь **' + (prodTitle.trim() || 'цей товар') + '**. Підказати характеристики, наявність чи підібрати альтернативи?');
            addChips(currentLang === 'en'
                ? ['🔍 Key specs', '🛡️ Warranty & returns', '💡 Cheaper alternatives', '💳 0% Installment']
                : ['🔍 Головні характеристики', '🛡️ Гарантія на цей товар', '💡 Дешевші аналоги', '💳 Оплата частинами 0%']);
        } else {
            addMessage('model', (i18n[currentLang] || i18n.uk).greeting);
            addChips(currentLang === 'en'
                ? ['🚚 Delivery terms', '💳 Installment 0%', '🛡️ Warranty & returns', '💻 Recommend laptops']
                : ['🚚 Умови доставки', '💳 Оплата частинами 0%', '🛡️ Гарантія та повернення', '💻 Порадь ноутбук']);
        }
    }

    updateTexts();
    renderInitialGreeting();

    try {
        new MutationObserver(function () {
            updateTexts();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch {}

    function toggleChat(open) {
        isOpen = typeof open === 'boolean' ? open : !isOpen;
        if (isOpen) {
            updateTexts();
            chatWindow.classList.add('open');
            triggerBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
            setTimeout(function () {
                input.focus();
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 50);
        } else {
            chatWindow.classList.remove('open');
            triggerBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        }
    }

    triggerBtn.addEventListener('click', function () {
        toggleChat();
    });

    closeBtn.addEventListener('click', function () {
        toggleChat(false);
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text || isLoading) return;

        var activeLang = getLang();
        var activeTexts = i18n[activeLang] || i18n.uk;
        var currentProdId = getCurrentProductContext();

        input.value = '';
        addMessage('user', text);
        showTyping();

        isLoading = true;
        // User can still write/type while the assistant generates an answer:
        // input remains ENABLED, only the submit button is disabled.
        sendBtn.disabled = true;

        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
            controller.abort();
        }, 30000);

        try {
            var res = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream, application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    message: text,
                    history: history,
                    language: activeLang,
                    currentProductId: currentProdId,
                    stream: true
                })
            });
            clearTimeout(timeoutId);

            var contentType = res.headers.get('content-type') || '';
            if (res.ok && contentType.includes('text/event-stream') && res.body && window.ReadableStream) {
                var botMsg = null;

                function ensureBotMsg() {
                    if (!botMsg) {
                        hideTyping();
                        botMsg = document.createElement('div');
                        botMsg.className = 'nova-msg nova-msg-bot';
                        messagesList.appendChild(botMsg);
                    }
                    return botMsg;
                }

                var reader = res.body.getReader();
                var decoder = new TextDecoder('utf-8');
                var buffer = '';
                var accumulatedReply = '';
                var metaData = null;

                while (true) {
                    var chunk = await reader.read();
                    if (chunk.done) break;
                    buffer += decoder.decode(chunk.value, { stream: true });
                    var lines = buffer.split('\n\n');
                    buffer = lines.pop();

                    for (var i = 0; i < lines.length; i++) {
                        var rawLine = lines[i].trim();
                        if (!rawLine.startsWith('data:')) continue;
                        var jsonStr = rawLine.slice(5).trim();
                        if (!jsonStr) continue;
                        try {
                            var evt = JSON.parse(jsonStr);
                            if (evt.type === 'meta') {
                                metaData = evt;
                            } else if (evt.type === 'delta') {
                                var el = ensureBotMsg();
                                accumulatedReply += (evt.text || '');
                                el.innerHTML = formatMessageHtml(accumulatedReply);
                                messagesList.scrollTop = messagesList.scrollHeight;
                            } else if (evt.type === 'done') {
                                var el = ensureBotMsg();
                                if (evt.reply) {
                                    accumulatedReply = evt.reply;
                                }
                                el.innerHTML = formatMessageHtml(accumulatedReply);
                                messagesList.scrollTop = messagesList.scrollHeight;
                            }
                        } catch (parseErr) {}
                    }
                }
                hideTyping();
                if (!accumulatedReply) {
                    accumulatedReply = activeTexts.errorReply;
                    var el = ensureBotMsg();
                    el.innerHTML = formatMessageHtml(accumulatedReply);
                }
                if (metaData && Array.isArray(metaData.comparison) && metaData.comparison.length >= 2) {
                    addComparisonCards(metaData.comparison);
                }
                if (metaData && Array.isArray(metaData.products) && metaData.products.length > 0) {
                    addProductCards(metaData.products);
                }
                history.push({ role: 'user', content: text });
                history.push({ role: 'model', content: accumulatedReply });
                if (history.length > 20) history = history.slice(-20);
            } else {
                var data = await res.json();
                hideTyping();
                var replyText = (data && data.reply) ? data.reply : activeTexts.errorReply;
                addMessage('model', replyText);
                if (data && Array.isArray(data.comparison) && data.comparison.length >= 2) {
                    addComparisonCards(data.comparison);
                }
                if (data && Array.isArray(data.products) && data.products.length > 0) {
                    addProductCards(data.products);
                }
                history.push({ role: 'user', content: text });
                history.push({ role: 'model', content: replyText });
                if (history.length > 20) history = history.slice(-20);
            }
        } catch {
            clearTimeout(timeoutId);
            hideTyping();
            addMessage('model', activeTexts.networkError);
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }
    });
})();
